/**
 * @file orderBulkRoutes.js
 * @description Phase 9 — Express route definitions for Bulk Operations.
 *
 * ROUTE DESIGN DECISIONS:
 *
 * 1. BASE PATH: Mounted at /api/v1/orders/bulk (registered in app.js)
 *    By registering this router BEFORE the main order router in app.js,
 *    we prevent the /api/v1/orders/:id route from hijacking the "bulk" segment.
 *
 * 2. ACCESS CONTROL:
 *    - All bulk routes are extremely dangerous and strictly require Admin privileges.
 */

"use strict";

const express = require("express");
const orderBulkController = require("../controllers/orderBulkController");
const orderBulkValidator = require("../validators/orderBulkValidator");
const validate = require("../middlewares/validate");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// ── Global Security: Only authenticated admins can perform bulk operations ──
router.use(protect);
router.use(restrictTo("admin"));

// ─────────────────────────────────────────────────────────────────────────────
// BULK ROUTES (Base: /api/v1/orders/bulk)
// ─────────────────────────────────────────────────────────────────────────────

/** POST /api/v1/orders/bulk/create */
router.post(
  "/create",
  validate(orderBulkValidator.createBulk),
  orderBulkController.createBulk
);

/** PATCH /api/v1/orders/bulk/update */
router.patch(
  "/update",
  validate(orderBulkValidator.updateBulk),
  orderBulkController.updateBulk
);

/** DELETE /api/v1/orders/bulk/delete */
router.delete(
  "/delete",
  validate(orderBulkValidator.deleteBulk),
  orderBulkController.deleteBulk
);

/** PATCH /api/v1/orders/bulk/status */
router.patch(
  "/status",
  validate(orderBulkValidator.updateStatusBulk),
  orderBulkController.updateStatusBulk
);

/** PATCH /api/v1/orders/bulk/archive */
router.patch(
  "/archive",
  validate(orderBulkValidator.archiveBulk),
  orderBulkController.archiveBulk
);

/** PATCH /api/v1/orders/bulk/restore */
router.patch(
  "/restore",
  validate(orderBulkValidator.restoreBulk),
  orderBulkController.restoreBulk
);

module.exports = router;
