/**
 * @file errorHandler.js
 * @description Global error-handling middleware for Express.
 *
 * HOW EXPRESS ERROR HANDLING WORKS:
 * Any middleware or route handler that calls next(error) — or throws inside
 * an async handler — will skip all normal middleware and land here.
 *
 * Express identifies error-handling middleware by its 4-argument signature:
 *   (err, req, res, next) ← the "err" first argument is the key.
 *
 * WHY CENTRALIZED:
 * Without this, each controller would need its own try/catch and its own
 * way of formatting the error response. Central handling means:
 *  - One place to update error format.
 *  - Consistent responses regardless of where the error originated.
 *  - Clean controllers — they throw, this handler formats.
 */

"use strict";

const config = require("../config/env");
const ApiError = require("../utils/ApiError");

// ─────────────────────────────────────────────────────────────
// Mongoose-specific error translators
// ─────────────────────────────────────────────────────────────

/**
 * Converts a Mongoose CastError (invalid ObjectId) into a 400 ApiError.
 * Example: GET /orders/not-a-valid-id → 400 "Invalid value for field: id"
 */
const handleCastError = (err) =>
  new ApiError(`Invalid value for field: ${err.path}`, 400);

/**
 * Converts a Mongoose duplicate key error (code 11000) into a 409 ApiError.
 * Example: registering with an email that already exists.
 */
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new ApiError(
    `Duplicate value "${value}" for field "${field}". Please use another value.`,
    409
  );
};

/**
 * Converts Mongoose ValidationErrors into a 422 ApiError.
 * Aggregates all field-level validation messages into one.
 */
const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new ApiError(`Validation failed: ${messages.join(". ")}`, 422);
};

// ─────────────────────────────────────────────────────────────
// Response formatters
// ─────────────────────────────────────────────────────────────

/**
 * Sends detailed error info in development mode.
 * Includes the full stack trace so developers can debug quickly.
 */
const sendDevError = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    statusCode: err.statusCode,
    status: err.status,
    message: err.message,
    stack: err.stack,
    error: err,
  });
};

/**
 * Sends a sanitized error in production mode.
 * Non-operational errors (programming bugs) get a generic message —
 * we never leak internal details to the client.
 */
const sendProdError = (err, res) => {
  // Operational = expected API error → show the real message.
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
    });
  }

  // Programming error → log internally, send generic message.
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Something went wrong. Please try again later.",
  });
};

// ─────────────────────────────────────────────────────────────
// Global Error Handler (4-argument Express middleware)
// ─────────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
const globalErrorHandler = (err, req, res, next) => {
  // Default to 500 if no statusCode was set on the error.
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (config.isDev) {
    // In development: show everything.
    sendDevError(err, res);
  } else {
    // In production: translate known Mongoose errors first, then sanitize.
    let error = { ...err, message: err.message };

    if (err.name === "CastError") error = handleCastError(error);
    if (err.code === 11000) error = handleDuplicateKeyError(error);
    if (err.name === "ValidationError") error = handleValidationError(error);

    sendProdError(error, res);
  }
};

module.exports = globalErrorHandler;
