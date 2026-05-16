/**
 * @file orderValidator.js
 * @description Joi validation schemas for Order APIs.
 */

"use strict";

const Joi = require("joi");

// Helper to validate MongoDB ObjectIds
const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/).message("Invalid ID format");

const createOrder = {
  body: Joi.object().keys({
    user: objectId.required(),
    orderItems: Joi.array()
      .items(
        Joi.object().keys({
          product: objectId.required(),
          name: Joi.string().required(),
          price: Joi.number().min(0).required(),
          quantity: Joi.number().integer().min(1).required(),
          image: Joi.string().optional(),
        })
      )
      .min(1)
      .required(),
    shippingAddress: Joi.object()
      .keys({
        street: Joi.string().required(),
        city: Joi.string().required(),
        state: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
      })
      .required(),
    itemsPrice: Joi.number().min(0).required(),
    taxPrice: Joi.number().min(0).required(),
    shippingPrice: Joi.number().min(0).required(),
    totalPrice: Joi.number().min(0).required(),
  }),
};

const getOrder = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
};

const updateOrder = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid("pending", "processing", "shipped", "delivered", "cancelled"),
    })
    .min(1), // Require at least one field to be updated
};

const deleteOrder = {
  params: Joi.object().keys({
    id: objectId.required(),
  }),
};

module.exports = {
  createOrder,
  getOrder,
  updateOrder,
  deleteOrder,
};
