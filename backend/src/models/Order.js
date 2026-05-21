/**
 * @file Order.js
 * @description Mongoose schema and model for Orders.
 *
 * ENGINEERING DECISION (Snapshotting vs Referencing):
 * For order items, we copy (snapshot) the product name, price, and image.
 * WE DO NOT JUST REFERENCE THE PRODUCT ID.
 * Why? If a product's price changes tomorrow from $10 to $20,
 * an order placed today must forever show it was purchased at $10.
 *
 * The shipping address is also snapshotted. If a user updates their default
 * address later, it shouldn't change the address of an order that already shipped.
 */

"use strict";

const mongoose = require("mongoose");

// Sub-schema for tracking each status transition (Phase 6 — History API)
const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled", "archived"],
    },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String, default: "system" }, // Could be a user email or "system"
    note: { type: String, default: null },
  },
  { _id: false } // No need for a separate _id on each history entry
);

// Sub-schema for items in the cart/order
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  // Snapshot data: captured at the time of purchase
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true, min: 1 },
  image: { type: String },
});

// Sub-schema for the snapshot of the shipping address
const shippingAddressSchema = new mongoose.Schema({
  street: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true, // Needed to quickly fetch "My Orders"
    },
    orderItems: {
      type: [orderItemSchema],
      validate: [
        (val) => val.length > 0,
        "Order must contain at least one item",
      ],
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    // Monetary calculations
    itemsPrice: { type: Number, required: true, default: 0.0 },
    taxPrice: { type: Number, required: true, default: 0.0 },
    shippingPrice: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
      index: true, // Crucial for admin dashboard filtering
    },

    // ── Phase 6: Advanced Order Business Logic Fields ───────────────

    /**
     * ARCHIVE / RESTORE (Phase 6)
     * Soft-deletion pattern: archived orders are hidden from normal listings
     * but preserved in the DB for audit/compliance purposes.
     */
    isArchived: { type: Boolean, default: false, index: true },
    archivedAt: { type: Date, default: null },

    /**
     * CANCELLATION TRACKING (Phase 6)
     * Records when and why an order was cancelled.
     */
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null, trim: true },

    /**
     * STATUS HISTORY TIMELINE (Phase 6)
     * An ordered array of state transitions.
     * Seeded automatically on order creation (see Order.pre('save') hook below).
     */
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    // Payments & Shipments will reference this order's _id.
  },
  {
    timestamps: true,
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Mongoose Middleware — Pre-save Hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * When a new order is created (isNew === true), seed the statusHistory
 * with the initial "pending" event so the timeline always has at least one entry.
 *
 * When an existing order's status field changes, append a new history entry.
 * This is automatic — controllers never need to manually push to statusHistory.
 */
orderSchema.pre("save", function (next) {
  if (this.isNew) {
    // Seed initial state on creation
    this.statusHistory = [
      {
        status: "pending",
        changedAt: this.createdAt || new Date(),
        changedBy: "system",
        note: "Order created.",
      },
    ];
  } else if (this.isModified("status")) {
    // Append new entry whenever status changes
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: "system",
      note: null,
    });
  }
  next();
});

module.exports = mongoose.model("Order", orderSchema);
