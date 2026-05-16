/**
 * @file orderRoutes.js
 * @description Express routes for Orders API.
 *
 * This file maps HTTP verbs and URLs to their specific Controller functions.
 * It also applies the Joi validation middleware BEFORE the controller runs.
 */

"use strict";

const express = require("express");
const orderController = require("../controllers/orderController");
const validate = require("../middlewares/validate");
const orderValidator = require("../validators/orderValidator");

const router = express.Router();

// Maps to /api/v1/orders
router
  .route("/")
  .post(validate(orderValidator.createOrder), orderController.createOrder)
  .get(orderController.getOrders); // Optional: add validate(orderValidator.getOrders) for query params

// Maps to /api/v1/orders/:id
router
  .route("/:id")
  .get(validate(orderValidator.getOrder), orderController.getOrder)
  .patch(validate(orderValidator.updateOrder), orderController.updateOrder)
  .delete(validate(orderValidator.deleteOrder), orderController.deleteOrder);

module.exports = router;
