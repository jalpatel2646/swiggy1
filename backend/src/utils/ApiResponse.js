/**
 * @file ApiResponse.js
 * @description Utility for sending consistent JSON API responses.
 *
 * WHY STANDARDIZE RESPONSES:
 * Without a standard shape, different controllers might return:
 *   { data: [] }  vs  { result: [] }  vs  { users: [] }
 * This makes the frontend brittle and the API unpredictable.
 *
 * Every success response from this API will follow:
 *   {
 *     "success": true,
 *     "statusCode": 200,
 *     "message": "...",
 *     "data": { ... }
 *   }
 *
 * And every error response (from the global error handler) will follow:
 *   {
 *     "success": false,
 *     "statusCode": 4xx/5xx,
 *     "message": "...",
 *     "errors": [ ... ]   ← only present when validation fails
 *   }
 */

"use strict";

/**
 * Sends a standardized success JSON response.
 *
 * @param {import('express').Response} res - Express response object.
 * @param {number} statusCode              - HTTP status code (e.g., 200, 201).
 * @param {string} message                 - Short, human-readable message.
 * @param {*}      [data=null]             - Payload to return to the client.
 */
const sendSuccess = (res, statusCode, message, data = null) => {
  const response = {
    success: true,
    statusCode,
    message,
  };

  // Only include the data key if there is actual data to return.
  // Avoids sending `"data": null` on 204 No Content style responses.
  if (data !== null && data !== undefined) {
    response.data = data;
  }

  return res.status(statusCode).json(response);
};

module.exports = { sendSuccess };
