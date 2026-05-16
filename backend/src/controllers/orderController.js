/**
 * @file orderController.js
 * @description Controller for Order APIs.
 *
 * WHY THIS EXISTS:
 * Controllers act as the glue between the HTTP request and the Service layer.
 * They extract data from `req.body` or `req.params`, pass it to the Service,
 * and then format the successful response using `ApiResponse`.
 * 
 * Notice how there are NO try/catch blocks here. The `catchAsync` wrapper
 * automatically handles rejected promises.
 */

"use strict";

const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/ApiResponse");
const orderService = require("../services/orderService");

/**
 * @desc    Create a new order
 * @route   POST /api/v1/orders
 * @access  Private (Assume JWT Auth in future phase)
 */
const createOrder = catchAsync(async (req, res) => {
  const order = await orderService.createOrder(req.body);
  sendSuccess(res, 201, "Order created successfully", order);
});

/**
 * @desc    Get all orders (with pagination and sorting)
 * @route   GET /api/v1/orders
 * @access  Private/Admin
 */
const getOrders = catchAsync(async (req, res) => {
  // Extract pagination/sorting options from query params
  const options = {
    page: req.query.page,
    limit: req.query.limit,
    sortBy: req.query.sortBy,
  };
  
  // Extract filters (excluding the options above)
  const filters = { ...req.query };
  delete filters.page;
  delete filters.limit;
  delete filters.sortBy;

  const result = await orderService.queryOrders(filters, options);
  sendSuccess(res, 200, "Orders retrieved successfully", result);
});

/**
 * @desc    Get order by ID
 * @route   GET /api/v1/orders/:id
 * @access  Private
 */
const getOrder = catchAsync(async (req, res) => {
  const order = await orderService.getOrderById(req.params.id);
  sendSuccess(res, 200, "Order retrieved successfully", order);
});

/**
 * @desc    Update order status
 * @route   PATCH /api/v1/orders/:id
 * @access  Private/Admin
 */
const updateOrder = catchAsync(async (req, res) => {
  const order = await orderService.updateOrderById(req.params.id, req.body);
  sendSuccess(res, 200, "Order updated successfully", order);
});

/**
 * @desc    Delete order by ID
 * @route   DELETE /api/v1/orders/:id
 * @access  Private/Admin
 */
const deleteOrder = catchAsync(async (req, res) => {
  await orderService.deleteOrderById(req.params.id);
  // Using 200 instead of 204 so we can still return our standardized JSON message
  sendSuccess(res, 200, "Order deleted successfully");
});

module.exports = {
  createOrder,
  getOrders,
  getOrder,
  updateOrder,
  deleteOrder,
};
