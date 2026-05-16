/**
 * @file env.js
 * @description Centralized environment configuration module.
 *
 * WHY THIS EXISTS:
 * Instead of scattering process.env.XYZ calls throughout the codebase,
 * we validate and export all config values from one place. This gives us:
 *  - A single source of truth for all configuration.
 *  - Early crash on missing required variables (fail-fast principle).
 *  - Easy to swap config sources in the future (e.g., AWS Secrets Manager).
 */

"use strict";

const dotenv = require("dotenv");

// Load environment variables from the .env file into process.env
dotenv.config();

/**
 * Validates that a required environment variable exists.
 * Throws an error at startup if it is missing (fail-fast).
 * @param {string} key - The environment variable name.
 * @returns {string} - The value of the environment variable.
 */
const requireEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `[Config] FATAL: Missing required environment variable: "${key}". ` +
        `Check your .env file.`
    );
  }
  return value;
};

// ─────────────────────────────────────────────────────────────
// Exported Configuration Object
// ─────────────────────────────────────────────────────────────
const config = {
  // ── Server ──────────────────────────────────────────────────
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT, 10) || 5000,
  isDev: (process.env.NODE_ENV || "development") === "development",
  isProd: process.env.NODE_ENV === "production",

  // ── MongoDB ─────────────────────────────────────────────────
  MONGO_URI: requireEnv("MONGO_URI"),

  // ── Security ────────────────────────────────────────────────
  JWT_SECRET: requireEnv("JWT_SECRET"),
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || "7d",

  // ── CORS ────────────────────────────────────────────────────
  // Parse comma-separated ALLOWED_ORIGINS into an array.
  ALLOWED_ORIGINS: (process.env.ALLOWED_ORIGINS || "http://localhost:3000")
    .split(",")
    .map((origin) => origin.trim()),
};

module.exports = config;
