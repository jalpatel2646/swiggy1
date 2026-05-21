/**
 * @file orderValidatorAdvanced.js
 * @description Phase 6 — Joi validation schemas for advanced Order APIs.
 *
 * WHY SEPARATE FROM orderValidator.js:
 *  - Keeps Phase 5 validators untouched (no regression risk)
 *  - New validators are additive and scoped to Phase 6 routes only
 *  - Each schema is clearly named after its endpoint
 *
 * VALIDATION STRATEGY:
 * Every route that accepts a dynamic `:orderId` URL param validates it
 * against the `objectId` regex to reject malformed IDs before they hit MongoDB.
 * This prevents Mongoose CastErrors from reaching the service layer.
 */

"use strict";

const Joi = require("joi");

// ── Shared primitive: MongoDB ObjectId format check ──────────────────────────
const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ID format. Must be a 24-character hex string.");

// ── Shared params schema (used by all :orderId routes) ───────────────────────
const orderIdParam = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /orders/:orderId/exists
// No body or query — only the param.
// ─────────────────────────────────────────────────────────────────────────────
const checkOrderExists = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /orders/:orderId/summary
// No body or query.
// ─────────────────────────────────────────────────────────────────────────────
const getOrderSummary = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /orders/:orderId/items
// No body or query.
// ─────────────────────────────────────────────────────────────────────────────
const getOrderItems = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /orders/:orderId/history
// No body or query.
// ─────────────────────────────────────────────────────────────────────────────
const getOrderHistory = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 5. PATCH /orders/:orderId/archive
// No body required. The action is implicit in the URL verb.
// ─────────────────────────────────────────────────────────────────────────────
const archiveOrder = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 6. PATCH /orders/:orderId/restore
// No body required.
// ─────────────────────────────────────────────────────────────────────────────
const restoreOrder = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 7. POST /orders/:orderId/cancel
// Requires a `reason` in the body for the audit trail.
//
// VALIDATION RULES:
//  - reason: required string, trimmed, 5–500 chars
//    Min 5 chars prevents throwaway reasons like "no" or "k".
//    Max 500 chars prevents abuse (large payloads, injection attempts).
// ─────────────────────────────────────────────────────────────────────────────
const cancelOrder = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
  body: Joi.object().keys({
    reason: Joi.string()
      .trim()
      .min(5)
      .max(500)
      .required()
      .messages({
        "string.min": "Cancellation reason must be at least 5 characters.",
        "string.max": "Cancellation reason must not exceed 500 characters.",
        "any.required": "A cancellation reason is required.",
      }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. POST /orders/:orderId/duplicate
// No body — all data is copied from the source order.
// ─────────────────────────────────────────────────────────────────────────────
const duplicateOrder = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /orders/:orderId/invoice
// No body or query.
// ─────────────────────────────────────────────────────────────────────────────
const getOrderInvoice = orderIdParam;

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
