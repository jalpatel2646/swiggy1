/**
 * @file ApiError.js
 * @description Custom operational error class for the API.
 *
 * WHY A CUSTOM ERROR CLASS:
 * Node's built-in Error only has a message and stack trace.
 * For an HTTP API, we need to attach:
 *  - statusCode  → What HTTP status to respond with (400, 404, 500...)
 *  - isOperational → Distinguishes "expected" API errors (bad user input,
 *    not found, unauthorized) from truly unexpected programming bugs.
 *
 * The global error handler uses `isOperational` to decide whether to
 * send a clean JSON response (true) or log a bug and return 500 (false).
 */

"use strict";

class ApiError extends Error {
  /**
   * @param {string}  message     - Human-readable error description.
   * @param {number}  statusCode  - HTTP status code to send to the client.
   * @param {boolean} [isOperational=true] - Mark as an expected API error.
   */
  constructor(message, statusCode, isOperational = true) {
    // Call the parent Error constructor to capture the stack trace.
    super(message);

    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith("4") ? "fail" : "error";

    // Capture the stack trace, excluding the constructor call itself.
    // This keeps stack traces clean — pointing to where the error was thrown,
    // not to this class definition.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
