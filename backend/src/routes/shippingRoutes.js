/**
 * @file shippingRoutes.js
 * @description Phase 7 — Express route definitions for Shipping & Delivery APIs.
 *
 * ROUTE DESIGN DECISIONS:
 *
 * 1. BASE PATH: Mounted at /api/v1/shipping (registered in app.js)
 *    Keeps shipping concerns fully separate from /api/v1/orders — clean URL namespace.
 *
 * 2. STATIC ROUTES FIRST: /carriers, /pending, /delivered, /returned are registered
 *    BEFORE parameterized routes (/tracking/:orderId, /estimate/:orderId, etc.)
 *    to prevent Express from matching a literal string as :orderId.
 *
 * 3. ACCESS CONTROL:
 *    - All routes require JWT auth (router.use(protect))
 *    - Admin-only routes (status updates, label creation, list endpoints)
 *      use restrictTo("admin")
 *    - Customer-accessible routes (tracking, estimate, reschedule, change-address)
 *      only require protect
 *
 * 4. MIDDLEWARE PIPELINE per request:
 *    protect → [restrictTo("admin")] → validate(schema) → controller → service
 */

"use strict";

const express = require("express");
const shippingController = require("../controllers/shippingController");
const shippingValidator = require("../validators/shippingValidator");
const validate = require("../middlewares/validate");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// ── Global: All shipping routes require authentication ──────────────────────
router.use(protect);

// ─────────────────────────────────────────────────────────────────────────────
// STATIC ROUTES (no URL params)
// Must be registered BEFORE parameterized routes to avoid routing conflicts.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/shipping/carriers
 * Returns metadata for all supported shipping carriers.
 * No DB call — pure config lookup. No body/query validation needed.
 * Access: Private (any authenticated user can view carrier options)
 */
router.get(
  "/carriers",
  shippingController.getCarriers
);

/**
 * GET /api/v1/shipping/pending
 * Returns all active/pending shipments with pagination.
 * Access: Admin only — exposes all orders in the fulfillment queue.
 */
router.get(
  "/pending",
  restrictTo("admin"),
  validate(shippingValidator.getPending),
  shippingController.getPending
);

/**
 * GET /api/v1/shipping/delivered
 * Returns all delivered shipments with pagination.
 * Access: Admin only.
 */
router.get(
  "/delivered",
  restrictTo("admin"),
  validate(shippingValidator.getDelivered),
  shippingController.getDelivered
);

/**
 * GET /api/v1/shipping/returned
 * Returns all returned shipments with pagination.
 * Access: Admin only.
 */
router.get(
  "/returned",
  restrictTo("admin"),
  validate(shippingValidator.getReturned),
  shippingController.getReturned
);

/**
 * POST /api/v1/shipping/create-label
 * Creates a shipping label + tracking number for an order.
 * Body: { orderId, carrier, shippingType }
 * Access: Admin only — only fulfillment staff can generate labels.
 */
router.post(
  "/create-label",
  restrictTo("admin"),
  validate(shippingValidator.createLabel),
  shippingController.createLabel
);

// ─────────────────────────────────────────────────────────────────────────────
// PARAMETERIZED ROUTES (with :orderId)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/shipping/tracking/:orderId
 * Returns full tracking info for a specific order's shipment.
 * Access: Private (customer can track their own order).
 */
router.get(
  "/tracking/:orderId",
  validate(shippingValidator.getTracking),
  shippingController.getTracking
);

/**
 * PATCH /api/v1/shipping/update-status/:orderId
 * Updates shipment status and appends a tracking event.
 * Body: { status, location?, description? }
 * Access: Admin only — carrier status updates are admin operations.
 */
router.patch(
  "/update-status/:orderId",
  restrictTo("admin"),
  validate(shippingValidator.updateStatus),
  shippingController.updateStatus
);

/**
 * GET /api/v1/shipping/estimate/:orderId
 * Returns delivery estimates for all carriers and shipping types.
 * Access: Private (customers choose shipping options).
 */
router.get(
  "/estimate/:orderId",
  validate(shippingValidator.getEstimate),
  shippingController.getEstimate
);

/**
 * PATCH /api/v1/shipping/change-address/:orderId
 * Updates the delivery address before shipment is picked up.
 * Body: { street, city, state, postalCode, country }
 * Access: Private (customer can change their own order's address).
 */
router.patch(
  "/change-address/:orderId",
  validate(shippingValidator.changeAddress),
  shippingController.changeAddress
);

/**
 * POST /api/v1/shipping/reschedule/:orderId
 * Reschedules delivery to a new date.
 * Body: { scheduledDeliveryDate, deliveryNotes? }
 * Access: Private (customer can reschedule their own delivery).
 */
router.post(
  "/reschedule/:orderId",
  validate(shippingValidator.reschedule),
  shippingController.reschedule
);

module.exports = router;
