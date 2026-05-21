/**
 * @file adminService.js
 * @description Phase 8 — Advanced service layer for Administrative Operations.
 *
 * SERVICE LAYER RESPONSIBILITIES:
 *  - High-performance Mongoose queries with projection optimization.
 *  - Enterprise-grade role-based restriction enforcement (e.g. self-lockout prevention).
 *  - Secure audit log generation for all state-changing administrator actions.
 *  - Robust MongoDB aggregation queries for sales and revenue analytics.
 *  - Detailed system telemetry extraction (system health metrics).
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  API Surface Covered                                             │
 * ├──────────────────────────────────────────────────────────────────┤
 * │  getUsers()          → GET  /admin/users                         │
 * │  getUser()           → GET  /admin/users/:id                     │
 * │  banUser()           → PATCH /admin/users/:id/ban                │
 * │  unbanUser()         → PATCH /admin/users/:id/unban              │
 * │  updateUserRole()    → PATCH /admin/users/:id/role               │
 * │  getOrders()         → GET  /admin/orders                        │
 * │  getSalesReport()    → GET  /admin/reports/sales                 │
 * │  getRevenueReport()  → GET  /admin/reports/revenue               │
 * │  getSystemHealth()   → GET  /admin/system/health                 │
 * │  getSystemLogs()     → GET  /admin/system/logs                   │
 * └──────────────────────────────────────────────────────────────────┘
 */

"use strict";

const os = require("os");
const mongoose = require("mongoose");
const User = require("../models/User");
const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");
const QueryBuilder = require("../utils/QueryBuilder");
const auditLogger = require("../utils/auditLogger");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get All Users (Paginated & Filterable)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a list of users, filterable, sortable, searchable, and paginated.
 * Uses QueryBuilder to process incoming Express query parameters.
 *
 * SECURITY CONSIDERATIONS:
 *  - Explicitly projects out password field (just in case model select: false changes).
 *  - Allows regex search on first name, last name, and email fields.
 *
 * @param {Object} query - req.query payload.
 * @returns {Promise<Object>} Paginated users results.
 */
const getUsers = async (query) => {
  const builder = new QueryBuilder(User.find().select("-password"), query)
    .filter()
    .search(["firstName", "lastName", "email"])
    .sort()
    .limitFields()
    .paginate()
    .lean(); // Phase 10 Optimization: Strip Mongoose overhead


  const users = await builder.mongooseQuery;

  // Count total matches
  const countBuilder = new QueryBuilder(User.find(), query)
    .filter()
    .search(["firstName", "lastName", "email"]);
  const totalResults = await countBuilder.mongooseQuery.countDocuments();

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: users,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Get User By ID
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns details for a single user by their ID.
 *
 * @param {string} userId - Target user ID.
 * @returns {Promise<Object>} User document.
 */
const getUser = async (userId) => {
  const user = await User.findById(userId).select("-password").lean(); // Phase 10 Optimization

  if (!user) {
    throw new ApiError("User not found.", 404);
  }
  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Ban User (Deactivate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bans a user by setting isActive = false.
 *
 * SECURITY CONTROLS:
 *  - Prevents an administrator from banning themselves (lockout prevention).
 *  - Audits the event using the secure audit logger.
 *
 * @param {string} userId - Target user to ban.
 * @param {Object} admin - The authenticated admin performing the ban.
 * @returns {Promise<Object>} The updated User document.
 */
const banUser = async (userId, admin) => {
  if (userId.toString() === admin._id.toString()) {
    throw new ApiError("Security Lockout: You cannot ban yourself.", 400);
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found.", 404);
  }

  if (!user.isActive) {
    throw new ApiError("Conflict: User is already banned/inactive.", 409);
  }

  user.isActive = false;
  await user.save();

  // Audit Log
  auditLogger.logAdminAction(admin, "BAN_USER", "User", userId, {
    targetUserEmail: user.email,
    reason: "Administrative ban applied.",
  });

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. Unban User (Reactivate)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Unbans a user by setting isActive = true.
 *
 * @param {string} userId - Target user to unban.
 * @param {Object} admin - The authenticated admin performing the unban.
 * @returns {Promise<Object>} The updated User document.
 */
const unbanUser = async (userId, admin) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found.", 404);
  }

  if (user.isActive) {
    throw new ApiError("Conflict: User is already active.", 409);
  }

  user.isActive = true;
  await user.save();

  // Audit Log
  auditLogger.logAdminAction(admin, "UNBAN_USER", "User", userId, {
    targetUserEmail: user.email,
  });

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// 5. Update User Role
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Updates a user's security role (e.g. demotion, promotion).
 *
 * SECURITY CONTROLS:
 *  - Prevents demoting the last active administrator in the database.
 *    Banning or demoting the last administrator would lock everyone out permanently.
 *  - Audits the event using the secure audit logger.
 *
 * @param {string} userId - Target user whose role is changing.
 * @param {string} newRole - Target role ("customer", "vendor", "admin").
 * @param {Object} admin - The authenticated admin performing the role change.
 * @returns {Promise<Object>} The updated User document.
 */
const updateUserRole = async (userId, newRole, admin) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError("User not found.", 404);
  }

  // Lockout prevention: demoting last admin
  if (user.role === "admin" && newRole !== "admin") {
    const activeAdminsCount = await User.countDocuments({ role: "admin", isActive: true });
    if (activeAdminsCount <= 1) {
      throw new ApiError(
        "Security Lockout: Demotion denied. This user is the sole active administrator in the system.",
        400
      );
    }
  }

  const oldRole = user.role;
  user.role = newRole;
  await user.save();

  // Audit Log
  auditLogger.logAdminAction(admin, "ROLE_CHANGE", "User", userId, {
    targetUserEmail: user.email,
    oldRole,
    newRole,
  });

  return user;
};

// ─────────────────────────────────────────────────────────────────────────────
// 6. Get All Orders (Admin View)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a list of all orders in the system, with advanced filtering, sorting,
 * searching, and pagination. Includes archived/cancelled orders.
 *
 * @param {Object} query - req.query payload.
 * @returns {Promise<Object>} Paginated orders results.
 */
const getOrders = async (query) => {
  const builder = new QueryBuilder(
    Order.find().populate("user", "firstName lastName email"),
    query
  )
    .filter()
    .search(["status"])
    .sort()
    .limitFields()
    .paginate()
    .lean(); // Phase 10 Optimization: Strip Mongoose overhead


  const orders = await builder.mongooseQuery;

  const countBuilder = new QueryBuilder(Order.find(), query)
    .filter()
    .search(["status"]);
  const totalResults = await countBuilder.mongooseQuery.countDocuments();

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: orders,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get Sales Analytics Report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates sales data (order quantities and average sizes) grouped by date.
 *
 * SECURITY CONSIDERATION:
 *  - Restricts range query to maximum 1 year difference to prevent DoS via massive
 *    aggregation cycles on huge collections.
 *
 * @param {string} startDateStr - ISO start date string.
 * @param {string} endDateStr - ISO end date string.
 * @param {"day"|"month"|"year"} groupBy - Period division.
 * @returns {Promise<Array>} List of sales metrics grouped by period.
 */
const getSalesReport = async (startDateStr, endDateStr, groupBy = "day") => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  // Validate dates
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError("Invalid date range values.", 400);
  }

  // Prevent DoS: Max 1 year range
  const timeDifference = Math.abs(endDate - startDate);
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (timeDifference > oneYearInMs) {
    throw new ApiError("Date range is restricted to a maximum duration of 1 year.", 400);
  }

  // Define date formatting string for aggregation group stage
  let formatStr = "%Y-%m-%d";
  if (groupBy === "month") formatStr = "%Y-%m";
  if (groupBy === "year") formatStr = "%Y";

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: "cancelled" }, // Exclude cancelled orders
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: formatStr, date: "$createdAt" },
        },
        totalOrders: { $sum: 1 },
        totalItemsSold: { $sum: { $size: "$orderItems" } },
        totalQuantitySold: { $sum: { $sum: "$orderItems.quantity" } },
        averageOrderValue: { $avg: "$totalPrice" },
        grossSales: { $sum: "$totalPrice" },
      },
    },
    {
      $sort: { _id: 1 }, // Chronological sort
    },
    {
      $project: {
        period: "$_id",
        totalOrders: 1,
        totalItemsSold: 1,
        totalQuantitySold: 1,
        averageOrderValue: { $round: ["$averageOrderValue", 2] },
        grossSales: { $round: ["$grossSales", 2] },
        _id: 0,
      },
    },
  ];

  return await Order.aggregate(pipeline);
};

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get Revenue Analytics Report
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Aggregates and decomposes revenue (gross, net, tax, and shipping breakdown).
 *
 * @param {string} startDateStr - ISO start date.
 * @param {string} endDateStr - ISO end date.
 * @param {"day"|"month"|"year"} groupBy - Period division.
 * @returns {Promise<Array>} Revenue reports list.
 */
const getRevenueReport = async (startDateStr, endDateStr, groupBy = "day") => {
  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    throw new ApiError("Invalid date range values.", 400);
  }

  const timeDifference = Math.abs(endDate - startDate);
  const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
  if (timeDifference > oneYearInMs) {
    throw new ApiError("Date range is restricted to a maximum duration of 1 year.", 400);
  }

  let formatStr = "%Y-%m-%d";
  if (groupBy === "month") formatStr = "%Y-%m";
  if (groupBy === "year") formatStr = "%Y";

  const pipeline = [
    {
      $match: {
        createdAt: { $gte: startDate, $lte: endDate },
        status: { $ne: "cancelled" }, // Exclude cancelled orders
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: formatStr, date: "$createdAt" },
        },
        grossRevenue: { $sum: "$totalPrice" },
        netRevenue: { $sum: "$itemsPrice" },
        taxCollected: { $sum: "$taxPrice" },
        shippingFees: { $sum: "$shippingPrice" },
        totalOrders: { $sum: 1 },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        period: "$_id",
        grossRevenue: { $round: ["$grossRevenue", 2] },
        netRevenue: { $round: ["$netRevenue", 2] },
        taxCollected: { $round: ["$taxCollected", 2] },
        shippingFees: { $round: ["$shippingFees", 2] },
        totalOrders: 1,
        _id: 0,
      },
    },
  ];

  return await Order.aggregate(pipeline);
};

// ─────────────────────────────────────────────────────────────────────────────
// 9. Get System Telemetry (Health Metrics)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Captures deep server telemetry, performance info, and connection states.
 *
 * SECURITY CONSIDERATION:
 *  - This endpoint exposes highly descriptive environment parameters.
 *    Access must be restricted strictly to Super Administrators.
 *
 * @returns {Promise<Object>} Diagnostic dashboard telemetry.
 */
const getSystemHealth = async () => {
  const dbStatus = mongoose.connection.readyState;
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  // Memory metrics
  const freeMem = os.freemem();
  const totalMem = os.totalmem();
  const usedMem = totalMem - freeMem;
  const memUsagePercentage = ((usedMem / totalMem) * 100).toFixed(2);

  // CPU Load
  const cpus = os.cpus();
  const loadAvg = os.loadavg(); // 1, 5, 15 min load

  return {
    status: dbStatus === 1 ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    process: {
      uptime: Math.round(process.uptime()), // in seconds
      pid: process.pid,
      nodeVersion: process.version,
      memoryUsage: {
        rss: (process.memoryUsage().rss / 1024 / 1024).toFixed(2) + " MB",
        heapTotal: (process.memoryUsage().heapTotal / 1024 / 1024).toFixed(2) + " MB",
        heapUsed: (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) + " MB",
      },
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      uptime: os.uptime(), // system uptime
      cpuCores: cpus.length,
      cpuModel: cpus[0]?.model || "unknown",
      loadAverage: loadAvg,
      memory: {
        total: (totalMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
        free: (freeMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
        used: (usedMem / 1024 / 1024 / 1024).toFixed(2) + " GB",
        usagePercent: memUsagePercentage + "%",
      },
    },
    database: {
      state: dbStates[dbStatus] || "unknown",
      name: mongoose.connection.name || "not connected",
      host: mongoose.connection.host || "N/A",
    },
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// 10. Get System Audit Logs
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a list of secure system audit logs with pagination support.
 *
 * @param {number} page - Page offset index.
 * @param {number} limit - Total line limits.
 * @returns {Object} Paginated log results.
 */
const getSystemLogs = (page, limit) => {
  return auditLogger.getAdminLogs(page, limit);
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
