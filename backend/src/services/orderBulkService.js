/**
 * @file orderBulkService.js
 * @description Phase 9 — Advanced service layer for Enterprise Bulk Operations.
 *
 * SERVICE LAYER RESPONSIBILITIES:
 *  - High-performance Mongoose bulk operations (insertMany, bulkWrite, updateMany, deleteMany).
 *  - Bypassing slow document-level middleware where appropriate, while manually preserving
 *    data integrity (e.g., manually appending statusHistory in bulk updates).
 *  - Handling large payloads efficiently to minimize database round trips.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  Bulk API Operations                                             │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  createOrdersInBulk()   → POST   /orders/bulk/create             │
 * │  updateOrdersInBulk()   → PATCH  /orders/bulk/update             │
 * │  deleteOrdersInBulk()   → DELETE /orders/bulk/delete             │
 * │  updateOrdersStatus()   → PATCH  /orders/bulk/status             │
 * │  archiveOrdersInBulk()  → PATCH  /orders/bulk/archive            │
 * │  restoreOrdersInBulk()  → PATCH  /orders/bulk/restore            │
 * └──────────────────────────────────────────────────────────────────┘
 */

"use strict";

const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Bulk Create Orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Creates multiple orders in a single database round trip.
 * Extremely useful for migrations, B2B batch imports, or system integrations.
 *
 * PERFORMANCE OPTIMIZATION:
 * Uses `insertMany` which bypasses individual `save()` calls but still applies
 * schema validation. We manually seed `statusHistory` because the `pre('save')`
 * hook is NOT triggered by `insertMany`.
 *
 * @param {Array<Object>} ordersData - Array of order objects.
 * @param {Object} reqUser - The authenticated user performing the bulk creation.
 * @returns {Promise<Object>} Summary of created orders.
 */
const createOrdersInBulk = async (ordersData, reqUser) => {
  if (!ordersData || ordersData.length === 0) {
    throw new ApiError("No order data provided for bulk creation.", 400);
  }

  // Pre-process orders to ensure user association and seed statusHistory
  const now = new Date();
  const processedOrders = ordersData.map((order) => {
    return {
      ...order,
      user: order.user || reqUser._id, // Default to current user if not provided (admin might provide other users)
      status: order.status || "pending",
      statusHistory: [
        {
          status: order.status || "pending",
          changedAt: now,
          changedBy: "system_bulk_import",
          note: "Order created via bulk import.",
        },
      ],
    };
  });

  // insertMany is atomic by default in Mongoose (if one fails, none are inserted) unless ordered: false is used.
  // We use ordered: false to allow valid documents to be inserted even if some fail validation.
  try {
    const result = await Order.insertMany(processedOrders, { ordered: false });
    return {
      message: "Bulk order creation successful.",
      insertedCount: result.length,
      orders: result.map((o) => o._id),
    };
  } catch (err) {
    // Handling BulkWriteError when ordered: false
    if (err.name === "BulkWriteError") {
      return {
        message: "Partial success in bulk creation.",
        insertedCount: err.insertedDocs.length,
        failedCount: err.writeErrors.length,
        errors: err.writeErrors.map((e) => ({
          index: e.index,
          errmsg: e.errmsg,
        })),
      };
    }
    throw err;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Bulk Update Orders (Distinct Updates per Order)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates multiple orders with distinct data per order in a single DB round trip.
 *
 * PERFORMANCE OPTIMIZATION:
 * Uses MongoDB `bulkWrite` with `updateOne` operations. This is vastly superior
 * to looping and calling `findByIdAndUpdate` N times.
 *
 * @param {Array<Object>} updates - Array of objects like { id: '...', updateData: { ... } }
 * @returns {Promise<Object>} Summary of the bulk update operation.
 */
const updateOrdersInBulk = async (updates) => {
  if (!updates || updates.length === 0) {
    throw new ApiError("No update data provided for bulk operation.", 400);
  }

  const bulkOps = updates.map((item) => {
    const { id, updateData } = item;
    
    // Prevent updating sensitive structural fields directly via bulk update
    delete updateData.statusHistory;
    delete updateData._id;
    delete updateData.createdAt;

    return {
      updateOne: {
        filter: { _id: id },
        update: { $set: updateData },
      },
    };
  });

  const result = await Order.bulkWrite(bulkOps, { ordered: false });

  return {
    message: "Bulk update executed.",
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bulk Delete Orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Hard deletes multiple orders.
 *
 * PERFORMANCE OPTIMIZATION:
 * Uses `deleteMany` with the `$in` operator to delete all matching IDs in
 * a single query execution plan.
 *
 * @param {Array<string>} orderIds - Array of order IDs to delete.
 * @returns {Promise<Object>} Deletion summary.
 */
const deleteOrdersInBulk = async (orderIds) => {
  if (!orderIds || orderIds.length === 0) {
    throw new ApiError("No order IDs provided for bulk deletion.", 400);
  }

  const result = await Order.deleteMany({ _id: { $in: orderIds } });

  return {
    message: "Bulk deletion executed.",
    deletedCount: result.deletedCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Bulk Update Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates the status for a batch of orders (e.g. marking 50 orders as "shipped").
 *
 * ENGINEERING DECISION:
 * Because `updateMany` bypasses Mongoose `pre('save')` hooks, the statusHistory
 * timeline would not be updated automatically. We must manually construct an
 * update query that uses `$set` for the status and `$push` for the history array.
 *
 * @param {Array<string>} orderIds - Array of order IDs.
 * @param {string} newStatus - The new status to apply to all provided orders.
 * @returns {Promise<Object>} Status update summary.
 */
const updateOrdersStatus = async (orderIds, newStatus) => {
  if (!orderIds || orderIds.length === 0) {
    throw new ApiError("No order IDs provided for bulk status update.", 400);
  }

  const historyEntry = {
    status: newStatus,
    changedAt: new Date(),
    changedBy: "system_bulk",
    note: "Status updated via bulk operation.",
  };

  const result = await Order.updateMany(
    { _id: { $in: orderIds } },
    {
      $set: { status: newStatus },
      $push: { statusHistory: historyEntry },
    }
  );

  return {
    message: `Bulk status update to '${newStatus}' executed.`,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Bulk Archive Orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Soft-archives multiple orders simultaneously.
 *
 * PERFORMANCE OPTIMIZATION:
 * Single `updateMany` query applying identical flags to all matched documents.
 *
 * @param {Array<string>} orderIds - Array of order IDs to archive.
 * @returns {Promise<Object>} Archive summary.
 */
const archiveOrdersInBulk = async (orderIds) => {
  if (!orderIds || orderIds.length === 0) {
    throw new ApiError("No order IDs provided for bulk archiving.", 400);
  }

  const result = await Order.updateMany(
    { _id: { $in: orderIds } },
    {
      $set: {
        isArchived: true,
        archivedAt: new Date(),
      },
    }
  );

  return {
    message: "Bulk archive executed.",
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Bulk Restore Orders
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Un-archives (restores) multiple orders simultaneously.
 *
 * @param {Array<string>} orderIds - Array of order IDs to restore.
 * @returns {Promise<Object>} Restore summary.
 */
const restoreOrdersInBulk = async (orderIds) => {
  if (!orderIds || orderIds.length === 0) {
    throw new ApiError("No order IDs provided for bulk restoration.", 400);
  }

  const result = await Order.updateMany(
    { _id: { $in: orderIds } },
    {
      $set: {
        isArchived: false,
        archivedAt: null,
      },
    }
  );

  return {
    message: "Bulk restore executed.",
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  };
};

module.exports = {
  createOrdersInBulk,
  updateOrdersInBulk,
  deleteOrdersInBulk,
  updateOrdersStatus,
  archiveOrdersInBulk,
  restoreOrdersInBulk,
};
