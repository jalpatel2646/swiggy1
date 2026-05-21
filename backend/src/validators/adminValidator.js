/**
 * @file adminValidator.js
 * @description Phase 8 — Joi security validation schemas for administrative APIs.
 *
 * SECURITY DESIGN:
 *  - Dynamic URL parameters (:id) are validated strictly against the 24-char hex format.
 *  - Enforces enum restrictions on role values ("customer", "vendor", "admin").
 *  - Analytics query inputs require standard ISO 8601 strings and validate
 *    chronological validity (startDate must be less than or equal to endDate).
 *  - Prevent SQL/NoSQL injection by enforcing specific schemas on parameters.
 */

"use strict";

const Joi = require("joi");

// ── Shared Primitives ─────────────────────────────────────────────────────────

/** MongoDB 24-character hexadecimal identifier */
const objectId = Joi.string()
  .regex(/^[0-9a-fA-F]{24}$/)
  .message("Invalid ID format. Must be a 24-character hex string.");

/** Reusable params schema for routes with an ':id' URL param */
const idParamSchema = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
};

/** Reusable pagination schema */
const paginationQuerySchema = {
  query: Joi.object()
    .keys({
      page: Joi.number().integer().min(1).default(1),
      limit: Joi.number().integer().min(1).max(100).default(10),
      sort: Joi.string().trim().optional(),
      fields: Joi.string().trim().optional(),
      search: Joi.string().trim().optional(),
    })
    .unknown(true), // Allow other dynamic query filters safely
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /admin/users
// ─────────────────────────────────────────────────────────────────────────────
const getUsers = paginationQuerySchema;

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /admin/users/:id
// ─────────────────────────────────────────────────────────────────────────────
const getUser = idParamSchema;

// ─────────────────────────────────────────────────────────────────────────────
// 3. PATCH /admin/users/:id/ban
// ─────────────────────────────────────────────────────────────────────────────
const banUser = idParamSchema;

// ─────────────────────────────────────────────────────────────────────────────
// 4. PATCH /admin/users/:id/unban
// ─────────────────────────────────────────────────────────────────────────────
const unbanUser = idParamSchema;

// ─────────────────────────────────────────────────────────────────────────────
// 5. PATCH /admin/users/:id/role
// ─────────────────────────────────────────────────────────────────────────────
const updateUserRole = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
  body: Joi.object().keys({
    role: Joi.string()
      .valid("customer", "admin", "vendor")
      .required()
      .messages({
        "any.only": "Invalid security role. Must be 'customer', 'admin', or 'vendor'.",
        "any.required": "Role field is required.",
      }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. GET /admin/orders
// ─────────────────────────────────────────────────────────────────────────────
const getOrders = paginationQuerySchema;

// ─────────────────────────────────────────────────────────────────────────────
// 7. GET /admin/reports/sales
// ─────────────────────────────────────────────────────────────────────────────
const getSalesReport = {
  query: Joi.object().keys({
    startDate: Joi.date().iso().required().messages({
      "date.format": "startDate must be a valid ISO 8601 date (e.g. YYYY-MM-DD).",
      "any.required": "startDate query parameter is required.",
    }),
    endDate: Joi.date().iso().min(Joi.ref("startDate")).required().messages({
      "date.format": "endDate must be a valid ISO 8601 date.",
      "date.min": "endDate cannot be chronologically prior to startDate.",
      "any.required": "endDate query parameter is required.",
    }),
    groupBy: Joi.string().valid("day", "month", "year").default("day").messages({
      "any.only": "groupBy option must be 'day', 'month', or 'year'.",
    }),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. GET /admin/reports/revenue
// ─────────────────────────────────────────────────────────────────────────────
const getRevenueReport = getSalesReport; // Shares exact same criteria

// ─────────────────────────────────────────────────────────────────────────────
// 9. GET /admin/system/health
// ─────────────────────────────────────────────────────────────────────────────
const getSystemHealth = {};

// ─────────────────────────────────────────────────────────────────────────────
// 10. GET /admin/system/logs
// ─────────────────────────────────────────────────────────────────────────────
const getSystemLogs = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(200).default(50),
  }),
};

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getUsers,
  getUser,
  banUser,
  unbanUser,
  updateUserRole,
  getOrders,
  getSalesReport,
  getRevenueReport,
  getSystemHealth,
  getSystemLogs,
};
