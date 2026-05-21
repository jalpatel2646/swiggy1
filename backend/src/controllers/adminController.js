/**
 * @file adminController.js
 * @description Phase 8 — Administrative API Controller Handlers.
 *
 * CONTROLLER RESPONSIBILITIES:
 *  - Intercept Express requests and extract security credentials, params, and body data.
 *  - Enrich the administrator's security context with metadata (requester's IP address).
 *  - Forward sanitized payload parameters to the adminService module.
 *  - Respond using standardized successful ApiResponse formatting (`sendSuccess`).
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  API Endpoint                             → Controller Action          │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  GET  /admin/users                        → getAllUsers                │
 * │  GET  /admin/users/:id                    → getUserById                │
 * │  PATCH /admin/users/:id/ban               → banUserById                │
 * │  PATCH /admin/users/:id/unban             → unbanUserById              │
 * │  PATCH /admin/users/:id/role              → updateUserRoleById         │
 * │  GET  /admin/orders                       → getAllOrders               │
 * │  GET  /admin/reports/sales                → getSalesReportData         │
 * │  GET  /admin/reports/revenue              → getRevenueReportData       │
 * │  GET  /admin/system/health                → getSystemHealthMetrics     │
 * │  GET  /admin/system/logs                  → getSystemAuditLogs         │
 * └────────────────────────────────────────────────────────────────────────┘
 */

"use strict";

const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/ApiResponse");
const adminService = require("../services/adminService");

/**
 * Extracts and normalizes client IP for security audits.
 *
 * @param {import('express').Request} req - Express request
 * @returns {string} Client IP address
 */
const _getClientIp = (req) => {
  return (
    req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
    req.socket.remoteAddress ||
    "127.0.0.1"
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get All Users
// ─────────────────────────────────────────────────────────────────────────────
const getAllUsers = catchAsync(async (req, res) => {
  const result = await adminService.getUsers(req.query);
  sendSuccess(res, 200, "Users list retrieved successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get User By ID
// ─────────────────────────────────────────────────────────────────────────────
const getUserById = catchAsync(async (req, res) => {
  const result = await adminService.getUser(req.params.id);
  sendSuccess(res, 200, "User details retrieved successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Ban User
// ─────────────────────────────────────────────────────────────────────────────
const banUserById = catchAsync(async (req, res) => {
  const adminContext = {
    ...req.user.toObject(),
    ip: _getClientIp(req),
  };
  const result = await adminService.banUser(req.params.id, adminContext);
  sendSuccess(res, 200, "User has been successfully banned and deactivated.", {
    userId: result._id,
    email: result.email,
    isActive: result.isActive,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Unban User
// ─────────────────────────────────────────────────────────────────────────────
const unbanUserById = catchAsync(async (req, res) => {
  const adminContext = {
    ...req.user.toObject(),
    ip: _getClientIp(req),
  };
  const result = await adminService.unbanUser(req.params.id, adminContext);
  sendSuccess(res, 200, "User has been successfully unbanned and reactivated.", {
    userId: result._id,
    email: result.email,
    isActive: result.isActive,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Update User Role
// ─────────────────────────────────────────────────────────────────────────────
const updateUserRoleById = catchAsync(async (req, res) => {
  const adminContext = {
    ...req.user.toObject(),
    ip: _getClientIp(req),
  };
  const result = await adminService.updateUserRole(
    req.params.id,
    req.body.role,
    adminContext
  );
  sendSuccess(res, 200, `User role successfully updated to '${req.body.role}'.`, {
    userId: result._id,
    email: result.email,
    role: result.role,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Get All Orders
// ─────────────────────────────────────────────────────────────────────────────
const getAllOrders = catchAsync(async (req, res) => {
  const result = await adminService.getOrders(req.query);
  sendSuccess(res, 200, "Orders administrative list retrieved successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get Sales Analytics Report
// ─────────────────────────────────────────────────────────────────────────────
const getSalesReportData = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const result = await adminService.getSalesReport(startDate, endDate, groupBy);
  sendSuccess(res, 200, "Sales aggregated analytics report generated.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get Revenue Analytics Report
// ─────────────────────────────────────────────────────────────────────────────
const getRevenueReportData = catchAsync(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;
  const result = await adminService.getRevenueReport(startDate, endDate, groupBy);
  sendSuccess(res, 200, "Revenue breakdown report generated successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Get System Telemetry (Health)
// ─────────────────────────────────────────────────────────────────────────────
const getSystemHealthMetrics = catchAsync(async (req, res) => {
  const result = await adminService.getSystemHealth();
  sendSuccess(res, 200, "System telemetry dashboard stats retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Get System Audit Logs
// ─────────────────────────────────────────────────────────────────────────────
const getSystemAuditLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 50;
  const result = adminService.getSystemLogs(page, limit);
  sendSuccess(res, 200, "Secure audit events timeline retrieved successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getAllUsers,
  getUserById,
  banUserById,
  unbanUserById,
  updateUserRoleById,
  getAllOrders,
  getSalesReportData,
  getRevenueReportData,
  getSystemHealthMetrics,
  getSystemAuditLogs,
};
