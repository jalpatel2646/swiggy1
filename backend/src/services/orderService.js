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
const QueryBuilder = require("../utils/QueryBuilder");

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
 * Retrieves all orders, with advanced filtering, sorting, and pagination.
 * @param {Object} query - The raw req.query object from Express.
 * @returns {Promise<Object>} Paginated result { results, page, limit, totalPages, totalResults }
 */
const queryOrders = async (query) => {
  // 1. Initialize the QueryBuilder with Order.find() and the req.query object.
  //    Pass the fields we want to enable regex searching on (e.g., 'status').
  const builder = new QueryBuilder(Order.find().populate("user", "firstName lastName email"), query)
    .filter()
    .search(["status"]) // We can search by status, e.g., ?search=ship
    .sort()
    .limitFields()
    .paginate()
    .lean(); // Phase 10 Optimization: Strips Mongoose Document wrapper for pure JSON speed


  // 2. Execute the query
  const orders = await builder.mongooseQuery;

  // 3. Count total documents matching the filter (for pagination metadata).
  //    We must create a NEW query instance for counting, stripped of skip/limit.
  const countBuilder = new QueryBuilder(Order.find(), query).filter().search(["status"]);
  const totalResults = await countBuilder.mongooseQuery.countDocuments();

  const page = parseInt(query.page, 10) || 1;
  const limit = parseInt(query.limit, 10) || 10;
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
