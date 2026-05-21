/**
 * @file orderHistory.js
 * @description Utility to build a human-readable order history / timeline.
 *
 * WHY THIS EXISTS:
 * The Order schema uses `timestamps: true`, giving us `createdAt` and `updatedAt`.
 * We also add a `statusHistory` array to the schema (in the Phase 6 Order model update)
 * to persist each state transition with an actor and timestamp.
 *
 * This utility transforms that raw array into a structured, frontend-friendly
 * timeline payload — complete with display labels, icons, and context messages.
 *
 * DESIGN DECISION:
 * We intentionally keep the raw `statusHistory` array on the schema and only
 * "render" it for API consumers here. This keeps the DB lean while giving the
 * presentation layer full flexibility.
 */

"use strict";

/**
 * Maps a status string to a display-friendly label and icon.
 */
const STATUS_META = {
  pending: {
    label: "Order Placed",
    icon: "🛒",
    description: "Your order has been received and is awaiting confirmation.",
  },
  processing: {
    label: "Processing",
    icon: "⚙️",
    description: "Your order is being prepared and items are being packed.",
  },
  shipped: {
    label: "Shipped",
    icon: "🚚",
    description: "Your order is on its way to the delivery address.",
  },
  delivered: {
    label: "Delivered",
    icon: "✅",
    description: "Your order has been successfully delivered.",
  },
  cancelled: {
    label: "Cancelled",
    icon: "❌",
    description: "This order has been cancelled.",
  },
  archived: {
    label: "Archived",
    icon: "📦",
    description: "This order has been archived and is no longer active.",
  },
};

/**
 * Builds a chronological history timeline from an order document.
 *
 * @param {import('mongoose').Document} order - The full order document.
 * @returns {Object} Structured history payload.
 */
const buildOrderHistory = (order) => {
  // ── Synthesize timeline entries ─────────────────────────────
  // Priority 1: Use explicit statusHistory array if present on the document.
  // Priority 2: Fall back to synthesizing from createdAt / updatedAt.
  let timeline = [];

  if (order.statusHistory && Array.isArray(order.statusHistory) && order.statusHistory.length > 0) {
    timeline = order.statusHistory.map((entry) => ({
      status: entry.status,
      ...STATUS_META[entry.status],
      changedAt: entry.changedAt,
      changedBy: entry.changedBy || "system",
      note: entry.note || null,
    }));
  } else {
    // Fallback: synthesize a minimal 1-event history from current state + timestamps
    timeline = [
      {
        status: "pending",
        ...STATUS_META["pending"],
        changedAt: order.createdAt,
        changedBy: "system",
        note: "Order initially created.",
      },
    ];

    // If current status differs from pending, add a synthetic "current" event
    if (order.status !== "pending") {
      timeline.push({
        status: order.status,
        ...STATUS_META[order.status] || {
          label: order.status,
          icon: "ℹ️",
          description: `Status changed to ${order.status}.`,
        },
        changedAt: order.updatedAt,
        changedBy: "system",
        note: null,
      });
    }
  }

  // Sort ascending by changedAt (earliest first)
  timeline.sort((a, b) => new Date(a.changedAt) - new Date(b.changedAt));

  return {
    orderId: order._id,
    currentStatus: order.status,
    currentStatusMeta: STATUS_META[order.status] || null,
    totalEvents: timeline.length,
    timeline,
    createdAt: order.createdAt,
    lastUpdatedAt: order.updatedAt,
  };
};

module.exports = { buildOrderHistory, STATUS_META };
