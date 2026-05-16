/**
 * @file catchAsync.js
 * @description Wrapper to catch errors in async functions and pass them to Express next().
 *
 * WHY THIS EXISTS:
 * Express 4 does not automatically catch rejected promises in async route handlers.
 * If an async function throws, the request hangs forever unless we wrap it in a try/catch.
 * Instead of putting try/catch in EVERY controller, we wrap the controller function
 * with `catchAsync`, which catches the error and forwards it to our global error handler.
 */

"use strict";

const catchAsync = (fn) => {
  return (req, res, next) => {
    // Execute the async function, catch any errors, pass to global error handler
    Promise.resolve(fn(req, res, next)).catch((err) => next(err));
  };
};

module.exports = catchAsync;
