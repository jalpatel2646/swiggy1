/**
 * @file validate.js
 * @description Reusable Joi validation middleware.
 *
 * WHY THIS EXISTS:
 * Controllers should only handle req/res flow. They shouldn't be clogged with
 * manual if-statements checking if `req.body.price > 0`.
 * This middleware intercepts the request, runs it against a Joi schema,
 * and if it fails, immediately throws a 400 ApiError (caught by global handler)
 * BEFORE it ever reaches the controller.
 */

"use strict";

const ApiError = require("../utils/ApiError");

/**
 * Middleware function that validates req.body, req.query, or req.params against a Joi schema.
 * @param {Object} schema - Joi schema object (e.g., { body: Joi.object({...}) })
 */
const validate = (schema) => (req, res, next) => {
  const validSchema = ["body", "query", "params"].reduce((acc, key) => {
    if (schema[key]) {
      acc[key] = schema[key];
    }
    return acc;
  }, {});

  const objectToValidate = ["body", "query", "params"].reduce((acc, key) => {
    if (schema[key]) {
      acc[key] = req[key];
    }
    return acc;
  }, {});

  const { value, error } = require("joi").compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(objectToValidate);

  if (error) {
    // Map array of error details into a single human-readable string
    const errorMessage = error.details
      .map((details) => details.message.replace(/"/g, ""))
      .join(", ");
      
    return next(new ApiError(`Validation Error: ${errorMessage}`, 400));
  }

  // Overwrite req objects with validated (and potentially type-cast) values
  Object.assign(req, value);
  return next();
};

module.exports = validate;
