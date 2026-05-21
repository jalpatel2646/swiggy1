/**
 * @file orderBulkValidator.js
 * @description Phase 9 — Joi validation schemas for Bulk Operations.
 *
 * VALIDATION STRATEGY:
 *  - High restriction on array lengths to prevent payload bombing (e.g. max 1000 items).
 *  - Ensures ID arrays consist only of valid 24-character hexadecimal ObjectIds.
 *  - Enforces schema structures for bulk updates.
 */

"use strict";

const Joi = require("joi");

// ── Shared Primitives ─────────────────────────────────────────────────────────

/** MongoDB 24-character hexadecimal identifier */
const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ID format. Must be a 24-character hex string.");

/** Shared validator for endpoints that accept a flat array of orderIds */
const orderIdsArrayBody = {
  body: Joi.object().keys({
    orderIds: Joi.array()
      .items(objectId)
      .min(1)
      .max(1000) // Performance constraint: max 1000 bulk ops per request
      .required()
      .messages({
        "array.min": "orderIds array cannot be empty.",
        "array.max": "Cannot process more than 1000 orders in a single bulk request.",
        "any.required": "orderIds array is required.",
      }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. POST /orders/bulk/create
// ─────────────────────────────────────────────────────────────────────────────
const createBulk = {
  body: Joi.object().keys({
    orders: Joi.array()
      .items(
        Joi.object({
          // Simplified validation for bulk insert speed, relying on Mongoose schema for deep integrity
          shippingAddress: Joi.object().required(),
          orderItems: Joi.array().min(1).required(),
          itemsPrice: Joi.number().min(0).required(),
          taxPrice: Joi.number().min(0).required(),
          shippingPrice: Joi.number().min(0).required(),
          totalPrice: Joi.number().min(0).required(),
          status: Joi.string().valid("pending", "processing", "shipped", "delivered", "cancelled").optional(),
          user: objectId.optional(),
        }).unknown(true)
      )
      .min(1)
      .max(1000)
      .required(),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. PATCH /orders/bulk/update
// ─────────────────────────────────────────────────────────────────────────────
const updateBulk = {
  body: Joi.object().keys({
    updates: Joi.array()
      .items(
        Joi.object({
          id: objectId.required(),
          updateData: Joi.object().min(1).required(),
        })
      )
      .min(1)
      .max(1000)
      .required(),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. DELETE /orders/bulk/delete
// ─────────────────────────────────────────────────────────────────────────────
const deleteBulk = orderIdsArrayBody;

// ─────────────────────────────────────────────────────────────────────────────
// 4. PATCH /orders/bulk/status
// ─────────────────────────────────────────────────────────────────────────────
const updateStatusBulk = {
  body: Joi.object().keys({
    orderIds: Joi.array().items(objectId).min(1).max(1000).required(),
    status: Joi.string()
      .valid("pending", "processing", "shipped", "delivered", "cancelled")
      .required(),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. PATCH /orders/bulk/archive
// ─────────────────────────────────────────────────────────────────────────────
const archiveBulk = orderIdsArrayBody;

// ─────────────────────────────────────────────────────────────────────────────
// 6. PATCH /orders/bulk/restore
// ─────────────────────────────────────────────────────────────────────────────
const restoreBulk = orderIdsArrayBody;

module.exports = {
  createBulk,
  updateBulk,
  deleteBulk,
  updateStatusBulk,
  archiveBulk,
  restoreBulk,
};
