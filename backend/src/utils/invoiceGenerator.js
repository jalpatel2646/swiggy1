/**
 * @file invoiceGenerator.js
 * @description Utility to generate a structured invoice object from an Order document.
 *
 * WHY THIS EXISTS:
 * Invoice generation requires assembling data from multiple fields of an order
 * (items, pricing, shipping, user info) into a presentation-ready structure.
 * Keeping this logic in a dedicated utility makes it:
 *  - Reusable (can power both JSON responses and future PDF generation)
 *  - Testable in isolation (no need for Express req/res objects)
 *  - Easy to extend (e.g., add tax breakdowns, discount lines, QR codes)
 */

"use strict";

/**
 * Formats a number as a USD currency string.
 * @param {number} value
 * @returns {string} e.g., "$12.99"
 */
const formatCurrency = (value) =>
  `$${Number(value || 0).toFixed(2)}`;

/**
 * Generates a human-readable invoice number from an order ID and creation date.
 * Format: INV-YYYYMMDD-<last 6 chars of ObjectId>
 * This is deterministic — calling it twice with the same order gives the same result.
 *
 * @param {import('mongoose').Document} order - A populated Mongoose Order document.
 * @returns {string} e.g., "INV-20240115-A3F9B2"
 */
const generateInvoiceNumber = (order) => {
  const date = new Date(order.createdAt);
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("");
  const idSuffix = String(order._id).slice(-6).toUpperCase();
  return `INV-${datePart}-${idSuffix}`;
};

/**
 * Builds the full invoice payload for an order.
 *
 * @param {import('mongoose').Document} order - Populated order (user populated).
 * @returns {Object} A structured, presentation-ready invoice object.
 */
const buildInvoice = (order) => {
  const invoiceNumber = generateInvoiceNumber(order);

  // ── Line Items ──────────────────────────────────────────────
  const lineItems = order.orderItems.map((item) => ({
    productId: item.product,
    name: item.name,
    image: item.image || null,
    unitPrice: Number(item.price),
    unitPriceFormatted: formatCurrency(item.price),
    quantity: item.quantity,
    lineTotal: Number((item.price * item.quantity).toFixed(2)),
    lineTotalFormatted: formatCurrency(item.price * item.quantity),
  }));

  // ── Pricing Summary ─────────────────────────────────────────
  const pricing = {
    itemsSubtotal: Number(order.itemsPrice),
    itemsSubtotalFormatted: formatCurrency(order.itemsPrice),
    tax: Number(order.taxPrice),
    taxFormatted: formatCurrency(order.taxPrice),
    shipping: Number(order.shippingPrice),
    shippingFormatted: formatCurrency(order.shippingPrice),
    grandTotal: Number(order.totalPrice),
    grandTotalFormatted: formatCurrency(order.totalPrice),
  };

  // ── Billing / Customer Info ─────────────────────────────────
  const customer = order.user
    ? {
        id: order.user._id,
        name: `${order.user.firstName} ${order.user.lastName}`.trim(),
        email: order.user.email,
      }
    : { id: order.user, name: "N/A", email: "N/A" };

  return {
    invoiceNumber,
    orderId: order._id,
    status: order.status,
    issuedAt: order.createdAt,
    updatedAt: order.updatedAt,
    customer,
    shippingAddress: order.shippingAddress,
    lineItems,
    pricing,
    itemCount: order.orderItems.length,
    totalQuantity: lineItems.reduce((sum, i) => sum + i.quantity, 0),
    meta: {
      generatedAt: new Date().toISOString(),
      currency: "USD",
      note: "This is a system-generated invoice. No signature required.",
    },
  };
};

module.exports = { buildInvoice, generateInvoiceNumber, formatCurrency };
