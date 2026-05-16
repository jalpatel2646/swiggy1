/**
 * @file notFound.js
 * @description Middleware to catch requests to undefined routes (404).
 *
 * WHY THIS IS NEEDED:
 * Express does not automatically return 404 for unmatched routes.
 * Without this, unmatched routes would silently hang or return an
 * ugly HTML Express error page.
 *
 * This middleware sits AFTER all route registrations in app.js.
 * Any request that hasn't been handled by a real route falls through to here.
 * We create an ApiError and call next(err) to hand off to the global
 * error handler — keeping error formatting consistent.
 */

"use strict";

const ApiError = require("../utils/ApiError");

/**
 * Catches all requests to routes that don't exist and passes a 404
 * ApiError to the global error handler.
 *
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
const notFound = (req, res, next) => {
  next(
    new ApiError(
      `Route not found: [${req.method}] ${req.originalUrl}`,
      404
    )
  );
};

module.exports = notFound;
