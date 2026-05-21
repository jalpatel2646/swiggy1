/**
 * @file orderServiceAdvanced.js
 * @description Phase 6 — Advanced business logic service for Order operations.
 *
 * WHY A SEPARATE FILE (not merged into orderService.js):
 * orderService.js already handles CRUD (Phases 1-5).
 * Mixing 9 more advanced methods into one 300+ line file hurts readability.
 * By separating Phase 6 concerns here, we follow the Single Responsibility Principle
 * and keep each file focused.
 *
 * Both files export plain functions — controllers simply require whichever they need.
 *
 * ┌──────────────────────────────────────────────────────────────┐
 * │  API Surface Covered in This File                           │
 * ├──────────────────────────────────────────────────────────────┤
 * │  checkOrderExists()   → GET  /orders/:orderId/exists        │
 * │  getOrderSummary()    → GET  /orders/:orderId/summary       │
 * │  getOrderItems()      → GET  /orders/:orderId/items         │
 * │  getOrderHistory()    → GET  /orders/:orderId/history       │
 * │  archiveOrder()       → PATCH /orders/:orderId/archive      │
 * │  restoreOrder()       → PATCH /orders/:orderId/restore      │
 * │  cancelOrder()        → POST  /orders/:orderId/cancel       │
 * │  duplicateOrder()     → POST  /orders/:orderId/duplicate    │
 * │  getOrderInvoice()    → GET  /orders/:orderId/invoice       │
 * └──────────────────────────────────────────────────────────────┘
 */

"use strict";

const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const { buildInvoice } = require("../utils/invoiceGenerator");
const { buildOrderHistory } = require("../utils/orderHistory");

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetches an order by its ID and throws 404 if not found.
 * Used internally by every service function in this file.
 *
 * @param {string} orderId
 * @param {Object} [populateOpts] - Mongoose populate config object.
 * @returns {Promise<import('mongoose').Document>}
 */
const _findOrderOrFail = async (orderId, populateOpts = null) => {
  let query = Order.findById(orderId);
  if (populateOpts) query = query.populate(populateOpts);
  const order = await query;
  if (!order) {
    throw new ApiError("Order not found.", 404);
  }
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Check Order Exists
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Checks whether an order with the given ID exists in the database.
 *
 * QUERY STRATEGY:
 * We use `.exists()` which runs `db.orders.findOne({ _id }, { _id: 1 })`
 * under the hood — the leanest possible existence check. It returns the
 * matched document's `_id` (truthy) or `null` (falsy). No full document hydration.
 *
 * EDGE CASES:
 *  - Invalid ObjectId format → Mongoose CastError → caught by global handler → 400
 *  - Non-existent ID → returns { exists: false } — NOT a 404. This is intentional.
 *    The endpoint is a boolean probe; "not found" is a valid, non-error answer.
 *
 * @param {string} orderId
 * @returns {Promise<{ exists: boolean, orderId: string }>}
 */
const checkOrderExists = async (orderId) => {
  const exists = await Order.exists({ _id: orderId });
  return {
    exists: Boolean(exists),
    orderId,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get Order Summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a lightweight summary of an order — key KPIs without the full document.
 *
 * QUERY STRATEGY:
 * We use `.select()` to project only the fields we need, reducing network payload.
 * We also populate `user` with only name and email (no password hash).
 *
 * USE CASE:
 * Dashboard cards, order list rows, notification previews — anywhere you need
 * quick metadata without fetching all orderItems.
 *
 * EDGE CASES:
 *  - Order not found → 404
 *  - Archived orders ARE returned (summary is a read-only view)
 *
 * @param {string} orderId
 * @returns {Promise<Object>} Summarized order payload
 */
const getOrderSummary = async (orderId) => {
  const order = await Order.findById(orderId)
    .select(
      "_id status isArchived totalPrice itemsPrice taxPrice shippingPrice " +
      "cancelledAt cancelReason archivedAt createdAt updatedAt user"
    )
    .populate("user", "firstName lastName email");

  if (!order) throw new ApiError("Order not found.", 404);

  const itemCount = await Order.aggregate([
    { $match: { _id: order._id } },
    { $project: { itemCount: { $size: "$orderItems" }, totalQuantity: { $sum: "$orderItems.quantity" } } },
  ]);

  const meta = itemCount[0] || { itemCount: 0, totalQuantity: 0 };

  return {
    orderId: order._id,
    status: order.status,
    isArchived: order.isArchived,
    customer: order.user
      ? {
          id: order.user._id,
          name: `${order.user.firstName} ${order.user.lastName}`.trim(),
          email: order.user.email,
        }
      : null,
    pricing: {
      itemsPrice: order.itemsPrice,
      taxPrice: order.taxPrice,
      shippingPrice: order.shippingPrice,
      totalPrice: order.totalPrice,
    },
    itemCount: meta.itemCount,
    totalQuantity: meta.totalQuantity,
    cancelledAt: order.cancelledAt || null,
    cancelReason: order.cancelReason || null,
    archivedAt: order.archivedAt || null,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Order Items
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns only the `orderItems` array of a given order.
 *
 * QUERY STRATEGY:
 * Use `.select("orderItems")` to retrieve ONLY the embedded items array,
 * preventing transmission of the full order document over the wire.
 *
 * EDGE CASES:
 *  - Order not found → 404
 *  - Items array is empty → still returns 200 with empty array (schema validates min 1,
 *    but defensive handling is good practice)
 *
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
const getOrderItems = async (orderId) => {
  const order = await Order.findById(orderId).select("orderItems status");
  if (!order) throw new ApiError("Order not found.", 404);

  const enrichedItems = order.orderItems.map((item) => ({
    productId: item.product,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image || null,
    lineTotal: Number((item.price * item.quantity).toFixed(2)),
  }));

  return {
    orderId,
    orderStatus: order.status,
    itemCount: enrichedItems.length,
    totalQuantity: enrichedItems.reduce((sum, i) => sum + i.quantity, 0),
    items: enrichedItems,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Get Order History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full status-change timeline for an order.
 *
 * QUERY STRATEGY:
 * Select only `statusHistory`, `status`, and timestamps to keep the response lean.
 * The `buildOrderHistory` utility then formats it into a structured timeline.
 *
 * EDGE CASES:
 *  - Order not found → 404
 *  - No statusHistory entries (old orders before Phase 6) → utility synthesizes
 *    a minimal timeline from createdAt / updatedAt (graceful degradation).
 *
 * @param {string} orderId
 * @returns {Promise<Object>}
 */
const getOrderHistory = async (orderId) => {
  const order = await Order.findById(orderId).select(
    "statusHistory status createdAt updatedAt"
  );
  if (!order) throw new ApiError("Order not found.", 404);
  return buildOrderHistory(order);
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Archive Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-archives an order (marks it inactive without deleting it).
 *
 * BUSINESS RULE:
 *  - Only `delivered` or `cancelled` orders can be archived.
 *    Archiving a "pending" or "processing" order would hide it from fulfillment staff.
 *  - Already-archived orders return a 409 Conflict.
 *
 * QUERY STRATEGY:
 * We update using `order.save()` (not `findByIdAndUpdate`) so that:
 *  1. The pre-save hook records the status change in statusHistory.
 *  2. Mongoose schema-level validators still run.
 *
 * @param {string} orderId
 * @param {string} [actorEmail] - Email of the user performing the action (for audit log).
 * @returns {Promise<Object>} The updated order document.
 */
const archiveOrder = async (orderId, actorEmail = "system") => {
  const order = await _findOrderOrFail(orderId);

  // Conflict check: already archived
  if (order.isArchived) {
    throw new ApiError("Order is already archived.", 409);
  }

  // Business rule: only terminal states can be archived
  const archivableStatuses = ["delivered", "cancelled"];
  if (!archivableStatuses.includes(order.status)) {
    throw new ApiError(
      `Only orders with status 'delivered' or 'cancelled' can be archived. Current status: '${order.status}'.`,
      422
    );
  }

  order.isArchived = true;
  order.archivedAt = new Date();

  // Manually append history entry for the archive action (not a status change)
  order.statusHistory.push({
    status: order.status, // status itself doesn't change
    changedAt: new Date(),
    changedBy: actorEmail,
    note: "Order archived.",
  });

  await order.save();
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Restore Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Restores a previously archived order back to an active state.
 *
 * BUSINESS RULE:
 *  - Calling restore on a non-archived order returns 409 Conflict.
 *  - The `archivedAt` timestamp is cleared to keep the record clean.
 *
 * @param {string} orderId
 * @param {string} [actorEmail]
 * @returns {Promise<Object>}
 */
const restoreOrder = async (orderId, actorEmail = "system") => {
  const order = await _findOrderOrFail(orderId);

  if (!order.isArchived) {
    throw new ApiError("Order is not archived. Nothing to restore.", 409);
  }

  order.isArchived = false;
  order.archivedAt = null;

  order.statusHistory.push({
    status: order.status,
    changedAt: new Date(),
    changedBy: actorEmail,
    note: "Order restored from archive.",
  });

  await order.save();
  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cancel Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Cancels an order and records the cancellation reason.
 *
 * BUSINESS RULES:
 *  1. Already-cancelled orders → 409 Conflict.
 *  2. Orders with status `shipped` or `delivered` cannot be self-cancelled by users.
 *     (Admin can override — handled at the route layer via role checks.)
 *  3. Sets `cancelledAt` timestamp and `cancelReason` string.
 *  4. Status is transitioned to `cancelled`, which triggers the pre-save hook
 *     to append a history entry automatically.
 *
 * @param {string} orderId
 * @param {string} reason - Required cancel reason for audit trail.
 * @param {string} [actorEmail]
 * @returns {Promise<Object>}
 */
const cancelOrder = async (orderId, reason, actorEmail = "system") => {
  const order = await _findOrderOrFail(orderId);

  if (order.status === "cancelled") {
    throw new ApiError("Order is already cancelled.", 409);
  }

  // Non-cancellable statuses for regular users (admin bypass handled at route level)
  const nonCancellable = ["shipped", "delivered"];
  if (nonCancellable.includes(order.status)) {
    throw new ApiError(
      `Orders with status '${order.status}' cannot be cancelled.`,
      422
    );
  }

  order.status = "cancelled";       // Triggers pre-save hook → statusHistory entry added
  order.cancelledAt = new Date();
  order.cancelReason = reason;

  // Override the auto-generated history note with the human-supplied reason
  // We do this AFTER save by patching the last pushed entry if needed.
  await order.save();

  // Patch the latest history entry's note with the actual reason
  const lastEntry = order.statusHistory[order.statusHistory.length - 1];
  if (lastEntry && lastEntry.status === "cancelled") {
    lastEntry.changedBy = actorEmail;
    lastEntry.note = `Cancelled: ${reason}`;
    await order.save();
  }

  return order;
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Duplicate Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates a brand-new `pending` order by copying an existing one's items
 * and shipping address.
 *
 * DESIGN DECISIONS:
 *  - The duplicate starts as `pending` regardless of the source order's status.
 *  - Prices are copied AS-IS from the source's snapshots (not re-fetched from products).
 *    This is correct: the snapshot represented the price the customer agreed to.
 *    If prices changed, a new cart should be used for new orders.
 *  - `statusHistory`, `cancelledAt`, `cancelReason`, `isArchived`, `archivedAt`
 *    are NOT copied — the duplicate is a fresh order.
 *  - The `user` field is copied from the source (same customer is re-ordering).
 *
 * EDGE CASES:
 *  - Source order not found → 404
 *  - Duplicating a cancelled order is allowed (customer wants to re-order)
 *
 * @param {string} orderId - ID of the source order to duplicate.
 * @returns {Promise<Object>} The newly created duplicate order.
 */
const duplicateOrder = async (orderId) => {
  const source = await _findOrderOrFail(orderId);

  const duplicatePayload = {
    user: source.user,
    orderItems: source.orderItems.map((item) => ({
      product: item.product,
      name: item.name,
      price: item.price,
      quantity: item.quantity,
      image: item.image,
    })),
    shippingAddress: {
      street: source.shippingAddress.street,
      city: source.shippingAddress.city,
      state: source.shippingAddress.state,
      postalCode: source.shippingAddress.postalCode,
      country: source.shippingAddress.country,
    },
    itemsPrice: source.itemsPrice,
    taxPrice: source.taxPrice,
    shippingPrice: source.shippingPrice,
    totalPrice: source.totalPrice,
    // status defaults to "pending" (schema default)
    // statusHistory is seeded by pre-save hook
  };

  const newOrder = await Order.create(duplicatePayload);

  return {
    sourceOrderId: source._id,
    duplicatedOrder: newOrder,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. Get Order Invoice
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates and returns a complete invoice payload for an order.
 *
 * QUERY STRATEGY:
 * Populate the `user` field with enough info for the invoice header (name, email).
 * The `buildInvoice` utility assembles all sections.
 *
 * EDGE CASES:
 *  - Order not found → 404
 *  - User reference may be deleted → handled gracefully in buildInvoice (shows "N/A")
 *
 * FUTURE EXTENSION:
 * Swap `buildInvoice(order)` return value for a PDF stream when adding
 * a PDF generation library (e.g., PDFKit or Puppeteer).
 *
 * @param {string} orderId
 * @returns {Promise<Object>} Structured invoice payload.
 */
const getOrderInvoice = async (orderId) => {
  const order = await Order.findById(orderId).populate(
    "user",
    "firstName lastName email"
  );
  if (!order) throw new ApiError("Order not found.", 404);
  return buildInvoice(order);
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  checkOrderExists,
  getOrderSummary,
  getOrderItems,
  getOrderHistory,
  archiveOrder,
  restoreOrder,
  cancelOrder,
  duplicateOrder,
  getOrderInvoice,
};
