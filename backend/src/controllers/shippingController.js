/**
 * @file shippingController.js
 * @description Phase 7 — HTTP controllers for Shipping & Delivery APIs.
 *
 * CONTROLLER RESPONSIBILITIES (strictly):
 *  1. Extract data from req.params / req.body / req.query / req.user
 *  2. Pass data to the appropriate shippingService function
 *  3. Format and send the success response via sendSuccess
 *
 * WHAT CONTROLLERS DO NOT OWN:
 *  - No database queries (service layer)
 *  - No business rules (service layer)
 *  - No try/catch (catchAsync wrapper handles that)
 *  - No data transformation (utils / service layer)
 *
 * ┌────────────────────────────────────────────────────────────────────────┐
 * │  Route                                    → Controller Handler        │
 * ├────────────────────────────────────────────────────────────────────────┤
 * │  GET  /shipping/tracking/:orderId         → getTracking               │
 * │  PATCH /shipping/update-status/:orderId   → updateStatus              │
 * │  GET  /shipping/pending                   → getPending                │
 * │  GET  /shipping/delivered                 → getDelivered              │
 * │  GET  /shipping/returned                  → getReturned               │
 * │  POST  /shipping/create-label             → createLabel               │
 * │  GET  /shipping/estimate/:orderId         → getEstimate               │
 * │  GET  /shipping/carriers                  → getCarriers               │
 * │  PATCH /shipping/change-address/:orderId  → changeAddress             │
 * │  POST  /shipping/reschedule/:orderId      → reschedule                │
 * └────────────────────────────────────────────────────────────────────────┘
 */

"use strict";

const catchAsync = require("../utils/catchAsync");
const { sendSuccess } = require("../utils/ApiResponse");
const shippingService = require("../services/shippingService");

// ─────────────────────────────────────────────────────────────────────────────
// 1. Get Tracking Info
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get full shipment tracking info (events timeline, status, ETA)
 * @route   GET /api/v1/shipping/tracking/:orderId
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true, "statusCode": 200,
 *   "message": "Tracking information retrieved.",
 *   "data": {
 *     "shipmentId": "...", "orderId": "...", "carrier": { "code": "fedex", "name": "FedEx" },
 *     "trackingNumber": "FX1K3M8X9A2Z", "trackingUrl": "https://fedex.com/...",
 *     "status": "in_transit",
 *     "estimatedDeliveryDate": "...",
 *     "trackingEvents": [ { "status": "...", "location": "...", "occurredAt": "..." } ],
 *     "shippingLabel": { "labelNumber": "...", "labelUrl": "..." }
 *   }
 * }
 */
const getTracking = catchAsync(async (req, res) => {
  const result = await shippingService.getTrackingByOrder(req.params.orderId);
  sendSuccess(res, 200, "Tracking information retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Update Shipment Status
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update a shipment's status and optionally log location/description
 * @route   PATCH /api/v1/shipping/update-status/:orderId
 * @access  Private/Admin
 *
 * REQUEST BODY:
 * {
 *   "status": "in_transit",
 *   "location": "Chicago Distribution Hub",   ← optional
 *   "description": "Package arrived at hub."  ← optional
 * }
 *
 * RESPONSE STRUCTURE:
 * {
 *   "success": true, "statusCode": 200,
 *   "message": "Shipment status updated to 'in_transit'.",
 *   "data": { ...updatedShipment }
 * }
 */
const updateStatus = catchAsync(async (req, res) => {
  const { status, location, description } = req.body;
  const result = await shippingService.updateShipmentStatus(
    req.params.orderId,
    status,
    location,
    description
  );
  sendSuccess(res, 200, `Shipment status updated to '${status}'.`, result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Get Pending Shipments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all pending/active shipments (not delivered or returned)
 * @route   GET /api/v1/shipping/pending
 * @access  Private/Admin
 *
 * QUERY PARAMS: ?page=1&limit=20
 *
 * RESPONSE STRUCTURE:
 * {
 *   "data": {
 *     "results": [ ...shipments ],
 *     "page": 1, "limit": 20, "totalPages": 5, "totalResults": 94
 *   }
 * }
 */
const getPending = catchAsync(async (req, res) => {
  const result = await shippingService.getPendingShipments(req.query);
  sendSuccess(res, 200, "Pending shipments retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Get Delivered Shipments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all delivered shipments
 * @route   GET /api/v1/shipping/delivered
 * @access  Private/Admin
 *
 * QUERY PARAMS: ?page=1&limit=20
 */
const getDelivered = catchAsync(async (req, res) => {
  const result = await shippingService.getDeliveredShipments(req.query);
  sendSuccess(res, 200, "Delivered shipments retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Get Returned Shipments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get all returned shipments
 * @route   GET /api/v1/shipping/returned
 * @access  Private/Admin
 *
 * QUERY PARAMS: ?page=1&limit=20
 */
const getReturned = catchAsync(async (req, res) => {
  const result = await shippingService.getReturnedShipments(req.query);
  sendSuccess(res, 200, "Returned shipments retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Create Shipping Label
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Create a shipping label (and shipment record) for an order
 * @route   POST /api/v1/shipping/create-label
 * @access  Private/Admin
 *
 * REQUEST BODY:
 * {
 *   "orderId": "6648a...",
 *   "carrier": "fedex",
 *   "shippingType": "standard"   ← optional, defaults to "standard"
 * }
 *
 * RESPONSE STRUCTURE:
 * {
 *   "statusCode": 201,
 *   "data": {
 *     "shipmentId": "...", "trackingNumber": "FX1K3M...",
 *     "carrier": "FedEx", "shippingType": "standard",
 *     "estimatedDeliveryDate": "...", "transitDays": 5,
 *     "shippingCost": 8.99, "shippingCostFormatted": "$8.99",
 *     "label": { "labelNumber": "LBL-20240521-...", "labelUrl": "https://..." }
 *   }
 * }
 */
const createLabel = catchAsync(async (req, res) => {
  const { orderId, carrier, shippingType } = req.body;
  const result = await shippingService.createShippingLabel(orderId, carrier, shippingType);
  sendSuccess(res, 201, "Shipping label created successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Get Delivery Estimate
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get delivery time and cost estimates for all carriers and shipping types
 * @route   GET /api/v1/shipping/estimate/:orderId
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "data": {
 *     "orderId": "...",
 *     "carriers": [
 *       {
 *         "carrier": "FedEx", "carrierCode": "fedex",
 *         "options": [
 *           { "shippingType": "standard", "transitDays": 5, "estimatedDate": "...",
 *             "cost": 8.99, "costFormatted": "$8.99", "deliveryWindow": "Arrives between 2:00 PM – 8:00 PM" }
 *         ]
 *       }
 *     ]
 *   }
 * }
 */
const getEstimate = catchAsync(async (req, res) => {
  const result = await shippingService.getDeliveryEstimate(req.params.orderId);
  sendSuccess(res, 200, "Delivery estimates retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. Get Carriers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Get metadata for all supported shipping carriers
 * @route   GET /api/v1/shipping/carriers
 * @access  Private
 *
 * RESPONSE STRUCTURE:
 * {
 *   "data": {
 *     "total": 5,
 *     "carriers": [
 *       { "code": "fedex", "name": "FedEx", "transitDays": {...}, "baseRates": {...}, "features": [...] }
 *     ]
 *   }
 * }
 */
const getCarriers = catchAsync(async (req, res) => {
  const result = shippingService.getCarriers(); // sync — no DB call
  sendSuccess(res, 200, "Carriers retrieved.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. Change Shipping Address
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Update the delivery address for an order (before pickup only)
 * @route   PATCH /api/v1/shipping/change-address/:orderId
 * @access  Private
 *
 * REQUEST BODY:
 * {
 *   "street": "456 Oak Ave",
 *   "city": "Boston",
 *   "state": "MA",
 *   "postalCode": "02101",
 *   "country": "US"
 * }
 *
 * RESPONSE STRUCTURE:
 * {
 *   "data": {
 *     "orderId": "...",
 *     "previousAddress": { ... },
 *     "updatedAddress": { ... },
 *     "updatedAt": "..."
 *   }
 * }
 */
const changeAddress = catchAsync(async (req, res) => {
  const result = await shippingService.changeShippingAddress(
    req.params.orderId,
    req.body
  );
  sendSuccess(res, 200, "Shipping address updated successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. Reschedule Delivery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @desc    Reschedule a delivery to a new date with optional delivery notes
 * @route   POST /api/v1/shipping/reschedule/:orderId
 * @access  Private
 *
 * REQUEST BODY:
 * {
 *   "scheduledDeliveryDate": "2024-05-30T00:00:00.000Z",
 *   "deliveryNotes": "Leave at door, ring bell twice."  ← optional
 * }
 *
 * RESPONSE STRUCTURE:
 * {
 *   "data": {
 *     "shipmentId": "...", "orderId": "...",
 *     "previousEstimatedDate": "...",
 *     "newScheduledDate": "...",
 *     "deliveryWindow": "Arrives between 2:00 PM – 8:00 PM",
 *     "deliveryNotes": "...",
 *     "status": "in_transit"
 *   }
 * }
 */
const reschedule = catchAsync(async (req, res) => {
  const { scheduledDeliveryDate, deliveryNotes } = req.body;
  const result = await shippingService.rescheduleDelivery(
    req.params.orderId,
    scheduledDeliveryDate,
    deliveryNotes
  );
  sendSuccess(res, 200, "Delivery rescheduled successfully.", result);
});

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  getTracking,
  updateStatus,
  getPending,
  getDelivered,
  getReturned,
  createLabel,
  getEstimate,
  getCarriers,
  changeAddress,
  reschedule,
};
