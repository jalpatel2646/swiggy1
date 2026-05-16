/**
 * @file orderService.js
 * @description Business logic layer for Orders.
 *
 * WHY A SERVICE LAYER:
 * Controllers should only parse the request and format the response.
 * Database queries, external API calls, and heavy business logic live in Services.
 * This makes the business logic highly reusable (e.g., we can call `createOrder`
 * from a webhook, a cron job, or a test, without needing a fake Express `req/res`).
 */

"use strict";

const Order = require("../models/Order");
const ApiError = require("../utils/ApiError");

/**
 * Creates a new order.
 * @param {Object} orderBody - The validated order data payload.
 * @returns {Promise<Object>} The created order document.
 */
const createOrder = async (orderBody) => {
  // In a real scenario, we might verify product stock here before creating
  const order = await Order.create(orderBody);
  return order;
};

/**
 * Retrieves all orders, with pagination.
 * @param {Object} filters - Mongoose query filters (e.g., { status: 'pending' })
 * @param {Object} options - Options containing limit, page, sortBy, etc.
 * @returns {Promise<Object>} Paginated result { results, page, limit, totalPages, totalResults }
 */
const queryOrders = async (filters, options) => {
  const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1;
  const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10;
  const skip = (page - 1) * limit;

  // Allows sorting via query strings e.g. sortBy=totalPrice:desc
  let sort = {};
  if (options.sortBy) {
    const parts = options.sortBy.split(":");
    sort[parts[0]] = parts[1] === "desc" ? -1 : 1;
  } else {
    sort = { createdAt: -1 }; // Default sort by newest
  }

  const ordersPromise = Order.find(filters).sort(sort).skip(skip).limit(limit).populate("user", "firstName lastName email");
  const countPromise = Order.countDocuments(filters);

  const [orders, totalResults] = await Promise.all([ordersPromise, countPromise]);
  const totalPages = Math.ceil(totalResults / limit);

  return {
    results: orders,
    page,
    limit,
    totalPages,
    totalResults,
  };
};

/**
 * Gets an order by ID.
 * @param {string} orderId - The MongoDB ID of the order.
 * @returns {Promise<Object>} The order document.
 * @throws {ApiError} If the order is not found.
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate("user", "firstName lastName email");
  if (!order) {
    throw new ApiError("Order not found", 404);
  }
  return order;
};

/**
 * Updates an order by ID.
 * @param {string} orderId - The MongoDB ID of the order.
 * @param {Object} updateBody - The fields to update.
 * @returns {Promise<Object>} The updated order document.
 * @throws {ApiError} If the order is not found.
 */
const updateOrderById = async (orderId, updateBody) => {
  const order = await getOrderById(orderId);
  Object.assign(order, updateBody);
  await order.save();
  return order;
};

/**
 * Deletes an order by ID.
 * @param {string} orderId - The MongoDB ID of the order.
 * @returns {Promise<Object>} The deleted order document.
 * @throws {ApiError} If the order is not found.
 */
const deleteOrderById = async (orderId) => {
  const order = await getOrderById(orderId);
  await order.deleteOne();
  return order;
};

module.exports = {
  createOrder,
  queryOrders,
  getOrderById,
  updateOrderById,
  deleteOrderById,
};
