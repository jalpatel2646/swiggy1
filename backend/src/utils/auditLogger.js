/**
 * @file auditLogger.js
 * @description Secure administrative audit logging system.
 *
 * WHY THIS EXISTS:
 * In a production-grade enterprise system, all administrative actions must be logged
 * for auditability, security analysis, and compliance (e.g., PCI-DSS, SOC 2).
 * These logs must record:
 *  - Who performed the action (admin email / user ID)
 *  - What action was performed (e.g., ban, role change)
 *  - When the action occurred (timestamp)
 *  - Which resource was affected (target entity ID and type)
 *  - Relevant details/payload (excluding sensitive fields like passwords/JWTs)
 *  - IP address of the requester (auditing metadata)
 *
 * This utility writes structured, tamper-evident JSON logs to a secure log file.
 */

"use strict";

const fs = require("fs");
const path = require("path");

// Resolve log file path to backend/logs/admin_audit.log
const LOGS_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE_PATH = path.join(LOGS_DIR, "admin_audit.log");

/**
 * Ensures the log directory exists.
 */
const _ensureLogDirectoryExists = () => {
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }
};

/**
 * Appends a structured log entry to the secure audit log file.
 *
 * @param {Object} admin - The admin user object performing the action (id, email, ip)
 * @param {string} action - Descriptive action name (e.g., "BAN_USER", "ROLE_CHANGE")
 * @param {string} targetType - Type of resource affected ("User", "Order", "System")
 * @param {string|null} targetId - ID of the target resource
 * @param {Object} [details={}] - Additional non-sensitive context/metadata
 */
const logAdminAction = (admin, action, targetType, targetId, details = {}) => {
  try {
    _ensureLogDirectoryExists();

    const logEntry = {
      timestamp: new Date().toISOString(),
      admin: {
        id: admin?._id || admin?.id || "system",
        email: admin?.email || "system@amazon.com",
        ip: admin?.ip || "127.0.0.1",
      },
      action,
      targetType,
      targetId: targetId || null,
      details,
    };

    // Append as a single line JSON string for easy parsing
    fs.appendFileSync(LOG_FILE_PATH, JSON.stringify(logEntry) + "\n", "utf8");
  } catch (err) {
    // Fail-silent in production but log internally to console so application doesn't crash on audit logging failure
    console.error("💥 AUDIT LOGGER ERROR: Failed to write to audit log file:", err);
  }
};

/**
 * Reads, parses, and returns the paginated logs in reverse chronological order (newest first).
 *
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Number of logs per page
 * @returns {Object} Paginated log results { results, page, limit, totalPages, totalResults }
 */
const getAdminLogs = (page = 1, limit = 50) => {
  try {
    _ensureLogDirectoryExists();

    if (!fs.existsSync(LOG_FILE_PATH)) {
      return {
        results: [],
        page,
        limit,
        totalPages: 0,
        totalResults: 0,
      };
    }

    const fileContent = fs.readFileSync(LOG_FILE_PATH, "utf8");
    const lines = fileContent.trim().split("\n").filter(Boolean);

    // Parse each line as JSON
    const allLogs = lines.map((line) => {
      try {
        return JSON.parse(line);
      } catch (err) {
        return { error: "Corrupted log line", raw: line };
      }
    });

    // Reverse logs to display newest first
    allLogs.reverse();

    const totalResults = allLogs.length;
    const skip = (page - 1) * limit;
    const paginatedLogs = allLogs.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalResults / limit);

    return {
      results: paginatedLogs,
      page,
      limit,
      totalPages,
      totalResults,
    };
  } catch (err) {
    console.error("💥 AUDIT LOGGER ERROR: Failed to read audit logs:", err);
    throw err;
  }
};

module.exports = {
  logAdminAction,
  getAdminLogs,
};
