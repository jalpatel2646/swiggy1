/**
 * @file shippingUtils.js
 * @description Reusable shipping utilities: carrier config, tracking number generation,
 *              delivery estimation, label generation, and delivery window calculation.
 *
 * WHY THIS EXISTS:
 * Shipping logic (carrier transit times, label formatting, date math) is
 * completely independent of Express, MongoDB, and business rules.
 * Keeping it in a pure utility file means:
 *  - Functions are testable without mocking any infrastructure
 *  - Service layer stays clean — it delegates formatting concerns here
 *  - Easy to swap carrier data when real carrier APIs are integrated
 *
 * ARCHITECTURE NOTE:
 * In production, generateTrackingNumber() and generateLabelUrl() would
 * call real carrier REST APIs (FedEx Ship API, UPS Rating API, etc.).
 * For now they produce realistic, deterministic mock data — the interface
 * is identical, so swapping the implementation is a one-line change per function.
 */

"use strict";

// ─────────────────────────────────────────────────────────────────────────────
// Carrier Configuration Registry
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Single source of truth for all carrier metadata.
 * The shippingType keys (standard, express, overnight) map to transit days.
 *
 * DESIGN DECISION:
 * Storing this as a plain object (not in MongoDB) is intentional.
 * Carrier names/codes/rates change infrequently. A DB round-trip for
 * static config is wasteful. This can be seeded to DB later if dynamic
 * carrier management is needed.
 */
const CARRIERS = {
  fedex: {
    name: "FedEx",
    code: "fedex",
    trackingPrefix: "FX",
    trackingUrlBase: "https://www.fedex.com/fedextrack/?trknbr=",
    transitDays: { standard: 5, express: 2, overnight: 1 },
    baseRates: { standard: 8.99, express: 19.99, overnight: 39.99 },
    features: ["Real-time tracking", "Signature required", "Insurance up to $100"],
    maxWeightKg: 68,
  },
  ups: {
    name: "UPS",
    code: "ups",
    trackingPrefix: "1Z",
    trackingUrlBase: "https://www.ups.com/track?tracknum=",
    transitDays: { standard: 5, express: 2, overnight: 1 },
    baseRates: { standard: 9.49, express: 21.99, overnight: 42.99 },
    features: ["Real-time tracking", "Delivery to PO Box", "Saturday delivery"],
    maxWeightKg: 70,
  },
  usps: {
    name: "USPS",
    code: "usps",
    trackingPrefix: "US",
    trackingUrlBase: "https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=",
    transitDays: { standard: 7, express: 3, overnight: 2 },
    baseRates: { standard: 6.99, express: 14.99, overnight: 28.99 },
    features: ["P.O. Box delivery", "APO/FPO delivery", "Priority Mail tracking"],
    maxWeightKg: 31.75,
  },
  dhl: {
    name: "DHL Express",
    code: "dhl",
    trackingPrefix: "DH",
    trackingUrlBase: "https://www.dhl.com/en/express/tracking.html?AWB=",
    transitDays: { standard: 6, express: 3, overnight: 2 },
    baseRates: { standard: 11.99, express: 24.99, overnight: 49.99 },
    features: ["International shipping", "Customs clearance", "Temperature control"],
    maxWeightKg: 300,
  },
  amazon_logistics: {
    name: "Amazon Logistics",
    code: "amazon_logistics",
    trackingPrefix: "TBA",
    trackingUrlBase: "https://track.amazon.com/tracking/",
    transitDays: { standard: 4, express: 2, overnight: 1 },
    baseRates: { standard: 0, express: 9.99, overnight: 19.99 },
    features: ["Real-time map tracking", "Photo on delivery", "Amazon Prime eligible"],
    maxWeightKg: 50,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Tracking Number Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a realistic carrier-specific tracking number.
 * Format: <PREFIX><TIMESTAMP_BASE36><RANDOM_SUFFIX>
 *
 * WHY BASE36: Produces compact, alphanumeric strings (like real tracking numbers).
 *
 * @param {string} carrierCode - One of the keys in CARRIERS.
 * @returns {string} e.g., "FX1K3M8X9A2Z"
 */
const generateTrackingNumber = (carrierCode) => {
  const carrier = CARRIERS[carrierCode];
  if (!carrier) throw new Error(`Unknown carrier: ${carrierCode}`);

  const prefix = carrier.trackingPrefix;
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `${prefix}${timePart}${randomPart}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Label Number Generator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generates a shipping label number.
 * Format: LBL-<YYYYMMDD>-<RANDOM_8_CHARS>
 *
 * @returns {string} e.g., "LBL-20240521-A3F9B2C1"
 */
const generateLabelNumber = () => {
  const now = new Date();
  const datePart = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const randomPart = Math.random().toString(36).substring(2, 10).toUpperCase();
  return `LBL-${datePart}-${randomPart}`;
};

/**
 * Generates a mock label URL (would be a real signed S3 URL in production).
 * @param {string} labelNumber
 * @param {string} carrierCode
 * @returns {string}
 */
const generateLabelUrl = (labelNumber, carrierCode) => {
  // In production: return presignedS3Url(labelNumber);
  return `https://api.amazon-orders.com/labels/${carrierCode}/${labelNumber}.pdf`;
};

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Estimation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates the estimated delivery date for a given carrier and shipping type.
 *
 * BUSINESS RULES:
 *  - Weekends are excluded for all carriers except USPS (which delivers Sundays)
 *  - The calculation starts from "today" (or a custom startDate if provided)
 *  - Holidays are NOT modeled here (future enhancement)
 *
 * @param {string} carrierCode - One of the keys in CARRIERS.
 * @param {"standard"|"express"|"overnight"} shippingType
 * @param {Date} [startDate] - Defaults to now. Pass a specific date for testing.
 * @returns {{ estimatedDate: Date, transitDays: number, shippingType: string }}
 */
const calculateEstimatedDelivery = (carrierCode, shippingType = "standard", startDate = new Date()) => {
  const carrier = CARRIERS[carrierCode];
  if (!carrier) throw new Error(`Unknown carrier: ${carrierCode}`);

  const transitDays = carrier.transitDays[shippingType];
  if (transitDays === undefined) throw new Error(`Unknown shippingType: ${shippingType}`);

  const date = new Date(startDate);
  let daysAdded = 0;
  const skipWeekends = carrierCode !== "usps"; // USPS delivers on Sundays

  while (daysAdded < transitDays) {
    date.setDate(date.getDate() + 1);
    const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
    if (skipWeekends && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
    daysAdded++;
  }

  return {
    estimatedDate: date,
    transitDays,
    shippingType,
    carrier: carrier.name,
    baseRate: carrier.baseRates[shippingType],
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Delivery Window
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculates a 2-hour delivery window from an estimated delivery date.
 * Amazon-style: "Arrives between 2:00 PM – 8:00 PM"
 *
 * @param {Date} estimatedDate
 * @returns {{ windowStart: string, windowEnd: string, fullLabel: string }}
 */
const getDeliveryWindow = (estimatedDate) => {
  const start = new Date(estimatedDate);
  start.setHours(14, 0, 0, 0); // 2:00 PM
  const end = new Date(estimatedDate);
  end.setHours(20, 0, 0, 0); // 8:00 PM

  const fmt = (d) =>
    d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

  return {
    windowStart: start.toISOString(),
    windowEnd: end.toISOString(),
    windowStartFormatted: fmt(start),
    windowEndFormatted: fmt(end),
    fullLabel: `Arrives between ${fmt(start)} – ${fmt(end)}`,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Format carrier for API response
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns all carriers as an array suitable for API responses.
 * @returns {Array<Object>}
 */
const getAllCarriers = () =>
  Object.values(CARRIERS).map((c) => ({
    code: c.code,
    name: c.name,
    trackingUrlBase: c.trackingUrlBase,
    transitDays: c.transitDays,
    baseRates: c.baseRates,
    features: c.features,
    maxWeightKg: c.maxWeightKg,
  }));

/**
 * Returns a single carrier's metadata.
 * @param {string} code
 * @returns {Object|null}
 */
const getCarrierByCode = (code) => CARRIERS[code] || null;

// ─────────────────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────────────────

module.exports = {
  CARRIERS,
  generateTrackingNumber,
  generateLabelNumber,
  generateLabelUrl,
  calculateEstimatedDelivery,
  getDeliveryWindow,
  getAllCarriers,
  getCarrierByCode,
};
