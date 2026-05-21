/**
 * @file orderControllerAdvanced.js
 * @description Phase 6 — Controllers for advanced Order operation APIs.
 *
 * CONTROLLER RESPONSIBILITIES:
 *  1. Extract data from req.params / req.body / req.user
 *  2. Call the appropriate service function
 *  3. Format and send the HTTP response via sendSuccess
 *
 * WHAT CONTROLLERS DO NOT DO:
 *  - No database queries (that's the service's job)
 *  - No try/catch blocks (catchAsync handles that)
 *  - No business rule logic (service layer owns that)
 *
 * ┌────────────────────────────────────────────────────────────────────┐
 * │  Route → Controller mapping                                        │
 * ├────────────────────────────────────────────────────────────────────┤
 * │  GET  /orders/:orderId/exists   → checkOrderExists                 │
 * │  GET  /orders/:orderId/summary  → getOrderSummary                  │
 * │  GET  /orders/:orderId/items    → getOrderItems                    │
 * │  GET  /orders/:orderId/history  → getOrderHistory                  │
 * │  PATCH /orders/:orderId/archive → archiveOrder                     │
 * │  PATCH /orders/:orderId/restore → restoreOrder                     │
 * │  POST  /orders/:orderId/cancel  → cancelOrder                      │
 * │  POST  /orders/:orderId/duplicate → duplicateOrder                 │
 * │  GET  /orders/:orderId/invoice  → getOrderInvoice                  │
 * └────────────────────────────────────────────────────────────────────┘
 */

"use strict";

const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/ApiResponse");
const advancedOrderService = require("../services/orderServiceAdvanced");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Check Order Exists
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Check if an order with the given ID exists
 * @route   GET /api/v1/orders/:orderId/exists
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order existence checked.",
 *   "data": {
 *     "exists": true,
 *     "orderId": "6648a..."
 *   }
 * }
 *
 * NOTE: This always returns 200 (not 404) because "not found" is a valid answer,
 * not an error condition for an existence probe.
 */
const checkOrderExists = catchAsync(async (req, res) => {
  const result = await advancedOrderService.checkOrderExists(req.params.orderId);
  sendSuccess(res, 200, "Order existence checked.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get Order Summary
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get a lightweight summary of an order (no full item list)
 * @route   GET /api/v1/orders/:orderId/summary
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order summary retrieved.",
 *   "data": {
 *     "orderId": "...",
 *     "status": "delivered",
 *     "isArchived": false,
 *     "customer": { "id": "...", "name": "...", "email": "..." },
 *     "pricing": { "itemsPrice": 50, "taxPrice": 5, "shippingPrice": 3, "totalPrice": 58 },
 *     "itemCount": 3,
 *     "totalQuantity": 7,
 *     ...
 *   }
 * }
 */
const getOrderSummary = catchAsync(async (req, res) => {
  const summary = await advancedOrderService.getOrderSummary(req.params.orderId);
  sendSuccess(res, 200, "Order summary retrieved.", summary);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Order Items
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get only the line-items (products) of a specific order
 * @route   GET /api/v1/orders/:orderId/items
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order items retrieved.",
 *   "data": {
 *     "orderId": "...",
 *     "orderStatus": "pending",
 *     "itemCount": 2,
 *     "totalQuantity": 4,
 *     "items": [
 *       { "productId": "...", "name": "...", "price": 9.99, "quantity": 2, "lineTotal": 19.98 }
 *     ]
 *   }
 * }
 */
const getOrderItems = catchAsync(async (req, res) => {
  const result = await advancedOrderService.getOrderItems(req.params.orderId);
  sendSuccess(res, 200, "Order items retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Get Order History
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get the full status-change timeline / audit trail of an order
 * @route   GET /api/v1/orders/:orderId/history
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order history retrieved.",
 *   "data": {
 *     "orderId": "...",
 *     "currentStatus": "shipped",
 *     "totalEvents": 3,
 *     "timeline": [
 *       { "status": "pending", "label": "Order Placed", "icon": "🛒", "changedAt": "..." },
 *       { "status": "processing", "label": "Processing", "changedAt": "..." },
 *       { "status": "shipped", "label": "Shipped", "changedAt": "..." }
 *     ]
 *   }
 * }
 */
const getOrderHistory = catchAsync(async (req, res) => {
  const history = await advancedOrderService.getOrderHistory(req.params.orderId);
  sendSuccess(res, 200, "Order history retrieved.", history);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Archive Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Soft-archive an order (hide from active lists without deleting)
 * @route   PATCH /api/v1/orders/:orderId/archive
 * @access  Private/Admin
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order archived successfully.",
 *   "data": { ...updatedOrder }
 * }
 */
const archiveOrder = catchAsync(async (req, res) => {
  // Pass the authenticated user's email for the audit log
  const actorEmail = req.user?.email || "system";
  const order = await advancedOrderService.archiveOrder(req.params.orderId, actorEmail);
  sendSuccess(res, 200, "Order archived successfully.", order);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Restore Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Restore a previously archived order back to active state
 * @route   PATCH /api/v1/orders/:orderId/restore
 * @access  Private/Admin
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order restored successfully.",
 *   "data": { ...updatedOrder }
 * }
 */
const restoreOrder = catchAsync(async (req, res) => {
  const actorEmail = req.user?.email || "system";
  const order = await advancedOrderService.restoreOrder(req.params.orderId, actorEmail);
  sendSuccess(res, 200, "Order restored successfully.", order);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Cancel Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Cancel an order and record the cancellation reason
 * @route   POST /api/v1/orders/:orderId/cancel
 * @access  Private
 *
 * REQUEST BODY (validated by Joi):
 * { "reason": "Changed my mind" }
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Order cancelled successfully.",
 *   "data": { ...updatedOrder }
 * }
 */
const cancelOrder = catchAsync(async (req, res) => {
  const actorEmail = req.user?.email || "system";
  const order = await advancedOrderService.cancelOrder(
    req.params.orderId,
    req.body.reason,
    actorEmail
  );
  sendSuccess(res, 200, "Order cancelled successfully.", order);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Duplicate Order
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a new pending order by duplicating an existing one
 * @route   POST /api/v1/orders/:orderId/duplicate
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 201,
 *   "message": "Order duplicated successfully.",
 *   "data": {
 *     "sourceOrderId": "...",
 *     "duplicatedOrder": { ...newOrder }
 *   }
 * }
 */
const duplicateOrder = catchAsync(async (req, res) => {
  const result = await advancedOrderService.duplicateOrder(req.params.orderId);
  sendSuccess(res, 201, "Order duplicated successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Get Order Invoice
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Generate and return a structured invoice for an order
 * @route   GET /api/v1/orders/:orderId/invoice
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Invoice generated successfully.",
 *   "data": {
 *     "invoiceNumber": "INV-20240115-A3F9B2",
 *     "orderId": "...",
 *     "customer": { "name": "...", "email": "..." },
 *     "shippingAddress": { ... },
 *     "lineItems": [ ... ],
 *     "pricing": { "grandTotal": 58.00, "grandTotalFormatted": "$58.00" },
 *     "meta": { "generatedAt": "...", "currency": "USD" }
 *   }
 * }
 */
const getOrderInvoice = catchAsync(async (req, res) => {
  const invoice = await advancedOrderService.getOrderInvoice(req.params.orderId);
  sendSuccess(res, 200, "Invoice generated successfully.", invoice);
});

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
