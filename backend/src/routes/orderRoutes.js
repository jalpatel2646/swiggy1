/**
 * @file orderRoutes.js
 * @description Express routes for Orders API.
 *
 * This file maps HTTP verbs and URLs to their specific Controller functions.
 * It also applies the Joi validation middleware BEFORE the controller runs.
 */

"use strict";

const express = require("express");
const orderController = require("../controllers/orderController");
const orderControllerAdvanced = require("../controllers/orderControllerAdvanced");
const validate = require("../middlewares/validate");
const orderValidator = require("../validators/orderValidator");
const orderValidatorAdvanced = require("../validators/orderValidatorAdvanced");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// ALL order routes require the user to be logged in
router.use(protect);

// Maps to /api/v1/orders
router
  .route("/")
  .post(validate(orderValidator.createOrder), orderController.createOrder)
  .get(restrictTo("admin"), validate(orderValidator.getOrders), orderController.getOrders);

// Maps to /api/v1/orders/:id
router
  .route("/:id")
  .get(validate(orderValidator.getOrder), orderController.getOrder)
  .patch(restrictTo("admin"), validate(orderValidator.updateOrder), orderController.updateOrder)
  .delete(restrictTo("admin"), validate(orderValidator.deleteOrder), orderController.deleteOrder);

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 6 — Advanced Order Business Logic Routes
// NOTE: These /:orderId sub-resource routes MUST be defined BEFORE the generic
// /:id route to prevent Express from matching "exists", "summary" etc. as :id.
// ─────────────────────────────────────────────────────────────────────────────

// ── Read-Only Sub-Resources ───────────────────────────────────────────────────

/** GET /api/v1/orders/:orderId/exists  — Boolean probe (no 404 on miss) */
router.get(
  "/:orderId/exists",
  validate(orderValidatorAdvanced.checkOrderExists),
  orderControllerAdvanced.checkOrderExists
);

/** GET /api/v1/orders/:orderId/summary  — Lightweight KPI snapshot */
router.get(
  "/:orderId/summary",
  validate(orderValidatorAdvanced.getOrderSummary),
  orderControllerAdvanced.getOrderSummary
);

/** GET /api/v1/orders/:orderId/items  — Line items only */
router.get(
  "/:orderId/items",
  validate(orderValidatorAdvanced.getOrderItems),
  orderControllerAdvanced.getOrderItems
);

/** GET /api/v1/orders/:orderId/history  — Status-change timeline */
router.get(
  "/:orderId/history",
  validate(orderValidatorAdvanced.getOrderHistory),
  orderControllerAdvanced.getOrderHistory
);

/** GET /api/v1/orders/:orderId/invoice  — Structured invoice payload */
router.get(
  "/:orderId/invoice",
  validate(orderValidatorAdvanced.getOrderInvoice),
  orderControllerAdvanced.getOrderInvoice
);

// ── State-Mutation Operations ─────────────────────────────────────────────

/** PATCH /api/v1/orders/:orderId/archive  — Soft-archive (Admin only) */
router.patch(
  "/:orderId/archive",
  restrictTo("admin"),
  validate(orderValidatorAdvanced.archiveOrder),
  orderControllerAdvanced.archiveOrder
);

/** PATCH /api/v1/orders/:orderId/restore  — Un-archive (Admin only) */
router.patch(
  "/:orderId/restore",
  restrictTo("admin"),
  validate(orderValidatorAdvanced.restoreOrder),
  orderControllerAdvanced.restoreOrder
);

// ── Resource-Creating Operations ───────────────────────────────────────────

/** POST /api/v1/orders/:orderId/cancel  — Cancel with reason (body required) */
router.post(
  "/:orderId/cancel",
  validate(orderValidatorAdvanced.cancelOrder),
  orderControllerAdvanced.cancelOrder
);

/** POST /api/v1/orders/:orderId/duplicate  — Re-order (creates new pending order) */
router.post(
  "/:orderId/duplicate",
  validate(orderValidatorAdvanced.duplicateOrder),
  orderControllerAdvanced.duplicateOrder
);

module.exports = router;
