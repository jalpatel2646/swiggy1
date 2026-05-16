/**
 * @file app.js
 * @description Express application setup — the heart of the backend.
 *
 * WHY app.js IS SEPARATE FROM server.js:
 * This is a critical architectural decision.
 *
 *  - app.js  → Creates and configures the Express application.
 *               No I/O operations. No database connections. No port binding.
 *               This means app.js can be imported in integration tests
 *               without starting the real server.
 *
 *  - server.js → Imports app.js, connects to the database, and THEN
 *                starts listening on a port. It owns the process lifecycle.
 *
 * Middleware registration ORDER matters in Express:
 *   1. Security / utility middleware first  (cors, morgan, json parser)
 *   2. Application routes
 *   3. 404 catch-all  (after routes, before error handler)
 *   4. Global error handler  (always LAST — must be 4-arg middleware)
 */

"use strict";

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const config = require("./config/env");

// ── Middleware imports ────────────────────────────────────────
const notFound = require("./middlewares/notFound");
const globalErrorHandler = require("./middlewares/errorHandler");

// ── Route imports ─────────────────────────────────────────────
const healthRoutes = require("./routes/healthRoutes");
// Future routes will be imported here:
// const authRoutes    = require('./routes/authRoutes');
// const orderRoutes   = require('./routes/orderRoutes');
// const productRoutes = require('./routes/productRoutes');

// ─────────────────────────────────────────────────────────────
// Create the Express Application
// ─────────────────────────────────────────────────────────────
const app = express();

// ─────────────────────────────────────────────────────────────
// 1. CORS — Cross-Origin Resource Sharing
//
// WHY: Browsers block frontend JavaScript from calling a different
// origin (domain/port) by default. CORS headers tell the browser
// which origins are allowed to make requests to this API.
//
// We read the allowed origins from config so it's environment-specific
// (dev: localhost:3000 | prod: your actual domain).
// ─────────────────────────────────────────────────────────────
app.use(
  cors({
    origin: config.ALLOWED_ORIGINS,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─────────────────────────────────────────────────────────────
// 2. Morgan — HTTP Request Logger
//
// WHY: Every incoming request is logged with method, URL, status code,
// and response time. Invaluable for debugging and auditing in production.
//
// We use 'dev' format in development (colorful, compact) and
// 'combined' (Apache-style, with IP + User-Agent) in production.
// ─────────────────────────────────────────────────────────────
app.use(morgan(config.isDev ? "dev" : "combined"));

// ─────────────────────────────────────────────────────────────
// 3. express.json() — JSON Body Parser
//
// WHY: Without this middleware, req.body is always undefined for
// POST/PUT/PATCH requests. This parses incoming JSON payloads.
//
// The 10mb limit protects against oversized payloads.
// ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));

// ─────────────────────────────────────────────────────────────
// 4. express.urlencoded() — URL-Encoded Body Parser
//
// WHY: Parses data submitted via HTML forms (application/x-www-form-urlencoded).
// Less common in pure REST APIs but included for completeness and form support.
// ─────────────────────────────────────────────────────────────
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─────────────────────────────────────────────────────────────
// ROUTE REGISTRATIONS
// ─────────────────────────────────────────────────────────────

// API versioning is built in from day one.
// All routes are prefixed with /api/v1 — this allows breaking changes
// in a future /api/v2 without removing the old API for existing clients.
const API_PREFIX = "/api/v1";

app.use(`${API_PREFIX}/health`, healthRoutes);

// Future routes:
// app.use(`${API_PREFIX}/auth`,     authRoutes);
// app.use(`${API_PREFIX}/orders`,   orderRoutes);
// app.use(`${API_PREFIX}/products`, productRoutes);
// app.use(`${API_PREFIX}/users`,    userRoutes);

// ─────────────────────────────────────────────────────────────
// 404 — Not Found Handler
// MUST come AFTER all route registrations.
// ─────────────────────────────────────────────────────────────
app.use(notFound);

// ─────────────────────────────────────────────────────────────
// Global Error Handler
// MUST be the LAST middleware registered.
// Express identifies it by its 4-argument signature (err, req, res, next).
// ─────────────────────────────────────────────────────────────
app.use(globalErrorHandler);

module.exports = app;
