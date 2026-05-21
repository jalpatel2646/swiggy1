/**
 * @file shippingValidator.js
 * @description Phase 7 — Joi validation schemas for all Shipping APIs.
 *
 * VALIDATION STRATEGY:
 *  - Every route with a dynamic :orderId param validates it against the
 *    24-character hex ObjectId regex before it reaches the service layer.
 *    This gives a clean 400 error instead of a Mongoose CastError 500.
 *
 *  - Body schemas enforce types, enums, and field-specific constraints
 *    (e.g., scheduledDeliveryDate must be ISO date; reason min 5 chars).
 *
 *  - Query schemas use .unknown(true) for pagination to future-proof against
 *    additional filter params being added later.
 *
 * DESIGN NOTE:
 *  Separating validators by phase (shippingValidator.js vs orderValidator.js)
 *  keeps each file focused and prevents merge conflicts during team development.
 */

"use strict";

const Joi = require("joi");

// ── Shared Primitives ─────────────────────────────────────────────────────────

/** MongoDB ObjectId — 24-character hexadecimal string */
const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ID format. Must be a 24-character hex string.");

/** Routes that accept :orderId as a URL param */
const orderIdParam = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
};

/** Pagination query params used by list endpoints */
const paginationQuery = {
  query: Joi.object()
    .keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(20),
    })
    .unknown(true),
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /shipping/tracking/:orderId
// ─────────────────────────────────────────────────────────────────────────────
const getTracking = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 2. PATCH /shipping/update-status/:orderId
//
// STATUS VALIDATION:
//   - Must be one of the allowed enum values on the Shipment schema.
//   - location and description are optional — used to enrich the tracking event.
// ─────────────────────────────────────────────────────────────────────────────
const updateStatus = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
  body: Joi.object().keys({
    status: Joi.string()
      .valid(
        "preparing",
        "picked_up",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "exception",
        "returned"
      )
      .required()
      .messages({
        "any.only":
          "Invalid status. Must be one of: preparing, picked_up, in_transit, out_for_delivery, delivered, exception, returned.",
        "any.required": "Shipment status is required.",
      }),
    location: Joi.string().trim().max(200).optional().messages({
      "string.max": "Location must not exceed 200 characters.",
    }),
    description: Joi.string().trim().max(500).optional().messages({
      "string.max": "Description must not exceed 500 characters.",
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /shipping/pending
// ─────────────────────────────────────────────────────────────────────────────
const getPending = paginationQuery;

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /shipping/delivered
// ─────────────────────────────────────────────────────────────────────────────
const getDelivered = paginationQuery;

// ─────────────────────────────────────────────────────────────────────────────
// 5. GET /shipping/returned
// ─────────────────────────────────────────────────────────────────────────────
const getReturned = paginationQuery;

// ─────────────────────────────────────────────────────────────────────────────
// 6. POST /shipping/create-label
//
// CARRIER VALIDATION: Exact enum match (lowercase) — prevents subtle typos.
// SHIPPING TYPE: Defaults to "standard" if not provided.
// ORDER ID: Validated as a 24-char hex string in the body (not a URL param here).
// ─────────────────────────────────────────────────────────────────────────────
const createLabel = {
  body: Joi.object().keys({
    orderId: objectId.required().messages({
      "any.required": "orderId is required to create a shipping label.",
    }),
    carrier: Joi.string()
      .valid("fedex", "ups", "usps", "dhl", "amazon_logistics")
      .required()
      .messages({
        "any.only":
          "Invalid carrier. Must be one of: fedex, ups, usps, dhl, amazon_logistics.",
        "any.required": "Carrier is required.",
      }),
    shippingType: Joi.string()
      .valid("standard", "express", "overnight")
      .default("standard")
      .messages({
        "any.only": "Invalid shippingType. Must be: standard, express, or overnight.",
      }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /shipping/estimate/:orderId
// ─────────────────────────────────────────────────────────────────────────────
const getEstimate = orderIdParam;

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /shipping/carriers
// No params, no body, no query — entirely static response.
// ─────────────────────────────────────────────────────────────────────────────
const getCarriers = {};

// ─────────────────────────────────────────────────────────────────────────────
// 9. PATCH /shipping/change-address/:orderId
//
// ADDRESS VALIDATION:
//   - All 5 address fields required (complete address — no partial updates).
//   - postalCode allows alphanumeric for international postal codes (e.g., "SW1A 1AA").
//   - country defaults to "US" but is still required for explicitness.
// ─────────────────────────────────────────────────────────────────────────────
const changeAddress = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
  body: Joi.object().keys({
    street: Joi.string().trim().min(3).max(200).required().messages({
      "string.min": "Street address must be at least 3 characters.",
      "any.required": "Street is required.",
    }),
    city: Joi.string().trim().min(2).max(100).required().messages({
      "any.required": "City is required.",
    }),
    state: Joi.string().trim().min(2).max(100).required().messages({
      "any.required": "State is required.",
    }),
    postalCode: Joi.string()
      .trim()
      .pattern(/^[a-zA-Z0-9\s\-]{3,10}$/)
      .required()
      .messages({
        "string.pattern.base": "Invalid postal code format.",
        "any.required": "Postal code is required.",
      }),
    country: Joi.string().trim().min(2).max(100).required().messages({
      "any.required": "Country is required.",
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. POST /shipping/reschedule/:orderId
//
// DATE VALIDATION:
//   - scheduledDeliveryDate must be a valid ISO 8601 date string.
//   - Joi.date().iso() handles parsing; future-date check is in the service layer
//     (service has access to "now" at call time, Joi schemas are static).
//   - deliveryNotes: optional, max 500 chars (matches schema maxlength).
// ─────────────────────────────────────────────────────────────────────────────
const reschedule = {
  params: Joi.object().keys({
    orderId: objectId.required(),
  }),
  body: Joi.object().keys({
    scheduledDeliveryDate: Joi.date().iso().required().messages({
      "date.base": "scheduledDeliveryDate must be a valid date.",
      "date.format": "scheduledDeliveryDate must be in ISO 8601 format (e.g., 2024-06-01T00:00:00.000Z).",
      "any.required": "scheduledDeliveryDate is required.",
    }),
    deliveryNotes: Joi.string().trim().max(500).optional().allow("").messages({
      "string.max": "Delivery notes must not exceed 500 characters.",
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getTracking,
  updateStatus,
  getPending,
  getDelivered,
  getReturned,
  createLabel,
  getEstimate,
  getCarriers,
  changeAddress,
  reschedule,
};
