/**
 * @file adminRoutes.js
 * @description Phase 8 — Administrative API Endpoint Routing Registrations.
 *
 * SECURITY ARCHITECTURE & POLICIES:
 *
 * 1. ZERO-TRUST BASE ACCESS:
 *    All routes require authentic session validation and explicit administrative privilege.
 *    This is enforced globally at the router entry point using:
 *      router.use(protect);
 *      router.use(restrictTo("admin"));
 *    This ensures no route inside this file is ever exposed by accident.
 *
 * 2. ROUTE SPECIFIC PIPELINE:
 *    Request → protect (JWT) → restrictTo("admin") → validate(Joi Schema) → Controller
 *
 * 3. ROUTE REGISTRATION SEQUENCE:
 *    Static endpoints (e.g. /reports/sales, /system/health) are declared prior to dynamic
 *    parameterized segments (e.g. /users/:id) to prevent wildcard string collision issues.
 */

"use strict";

const express = require("express");
const adminController = require("../controllers/adminController");
const adminValidator = require("../validators/adminValidator");
const validate = require("../middlewares/validate");
const { protect, restrictTo } = require("../middlewares/authMiddleware");

const router = express.Router();

// ── Global Security Boundaries ────────────────────────────────────────────────
// Protect all routes with authentication and strict admin-only authorization
router.use(protect);
router.use(restrictTo("admin"));

// ── 1. Reports & Analytics (Static Routes) ────────────────────────────────────

/**
 * GET /api/v1/admin/reports/sales
 * Aggregates order metrics grouped chronologically.
 */
router.get(
  "/reports/sales",
  validate(adminValidator.getSalesReport),
  adminController.getSalesReportData
);

/**
 * GET /api/v1/admin/reports/revenue
 * Aggregates item sales, tax collections, and shipping fees.
 */
router.get(
  "/reports/revenue",
  validate(adminValidator.getRevenueReport),
  adminController.getRevenueReportData
);

// ── 2. System Diagnostic Tools (Static Routes) ───────────────────────────────

/**
 * GET /api/v1/admin/system/health
 * Returns process statistics, CPU cores, system platform, database connection health.
 */
router.get(
  "/system/health",
  validate(adminValidator.getSystemHealth),
  adminController.getSystemHealthMetrics
);

/**
 * GET /api/v1/admin/system/logs
 * Exposes securely recorded system audit events.
 */
router.get(
  "/system/logs",
  validate(adminValidator.getSystemLogs),
  adminController.getSystemAuditLogs
);

// ── 3. Administrative Orders Control (Static/Query Routes) ───────────────────

/**
 * GET /api/v1/admin/orders
 * Returns administrative listing of all orders, including deleted/archived orders.
 */
router.get(
  "/orders",
  validate(adminValidator.getOrders),
  adminController.getAllOrders
);

// ── 4. Administrative User Management (Dynamic Routes) ───────────────────────

/**
 * GET /api/v1/admin/users
 * Returns list of system users (excluding passwords) with pagination and search.
 */
router.get(
  "/users",
  validate(adminValidator.getUsers),
  adminController.getAllUsers
);

/**
 * GET /api/v1/admin/users/:id
 * Returns complete user details.
 */
router.get(
  "/users/:id",
  validate(adminValidator.getUser),
  adminController.getUserById
);

/**
 * PATCH /api/v1/admin/users/:id/ban
 * Administrative deactivation / banning of user.
 */
router.patch(
  "/users/:id/ban",
  validate(adminValidator.banUser),
  adminController.banUserById
);

/**
 * PATCH /api/v1/admin/users/:id/unban
 * Administrative reactivation / unbanning of user.
 */
router.patch(
  "/users/:id/unban",
  validate(adminValidator.unbanUser),
  adminController.unbanUserById
);

/**
 * PATCH /api/v1/admin/users/:id/role
 * Administrative modification of user roles (with self-lockout guards).
 */
router.patch(
  "/users/:id/role",
  validate(adminValidator.updateUserRole),
  adminController.updateUserRoleById
);

module.exports = router;
