/**
 * @file server.js
 * @description Application entry point — owns the process lifecycle.
 *
 * RESPONSIBILITY:
 * This file does ONE thing: boot the application safely.
 *
 * Execution order:
 *   1. Load centralized config (which validates all required env vars).
 *   2. Connect to MongoDB (async, awaited — we don't start accepting traffic
 *      until the database is ready).
 *   3. Start the Express HTTP server.
 *   4. Register process-level event handlers for graceful shutdown and
 *      unhandled errors.
 *
 * WHY GRACEFUL SHUTDOWN:
 * In production (containers, Kubernetes, PM2), the process receives a SIGTERM
 * signal when it should stop (e.g., during a rolling deploy). Without a
 * graceful shutdown handler, in-flight requests would be abruptly cut off.
 * Our handler:
 *   1. Stops accepting new requests.
 *   2. Closes the MongoDB connection cleanly.
 *   3. Exits with code 0 (success).
 */

"use strict";

const config = require("./src/config/env");
const connectDB = require("./src/config/db");
const app = require("./src/app");

// ─────────────────────────────────────────────────────────────
// Server instance reference — needed for graceful shutdown.
// ─────────────────────────────────────────────────────────────
let server;

// ─────────────────────────────────────────────────────────────
// Bootstrap Function
// ─────────────────────────────────────────────────────────────

/**
 * Connects to MongoDB and starts the HTTP server.
 * If the DB connection fails, the process exits immediately —
 * running an API without a database is pointless and dangerous.
 */
const bootstrap = async () => {
  try {
    // Step 1: Establish MongoDB connection BEFORE starting HTTP server.
    await connectDB();

    // Step 2: Start accepting HTTP traffic only after DB is ready.
    server = app.listen(config.PORT, () => {
      console.log("─────────────────────────────────────────────────");
      console.log(`🚀  Server is running`);
      console.log(`   Environment : ${config.NODE_ENV}`);
      console.log(`   Port        : ${config.PORT}`);
      console.log(
        `   Health      : http://localhost:${config.PORT}/api/v1/health`
      );
      console.log("─────────────────────────────────────────────────");
    });
  } catch (err) {
    console.error(`❌  Failed to start server: ${err.message}`);
    process.exit(1); // Exit code 1 = failure
  }
};

// ─────────────────────────────────────────────────────────────
// Graceful Shutdown Handler
// ─────────────────────────────────────────────────────────────

/**
 * Cleanly shuts down the HTTP server and database connection.
 * @param {string} signal - The OS signal that triggered the shutdown.
 */
const gracefulShutdown = (signal) => {
  console.log(`\n⚡  Received ${signal}. Initiating graceful shutdown...`);

  // Stop accepting new requests. Waits for in-flight requests to finish.
  if (server) {
    server.close(async () => {
      console.log("🔒  HTTP server closed.");

      const mongoose = require("mongoose");
      try {
        await mongoose.connection.close();
        console.log("🔒  MongoDB connection closed.");
      } catch (err) {
        console.error(`❌  Error closing MongoDB: ${err.message}`);
      }

      console.log("👋  Shutdown complete. Goodbye.");
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

// ─────────────────────────────────────────────────────────────
// Process-Level Event Handlers
// ─────────────────────────────────────────────────────────────

// SIGTERM — sent by Docker, Kubernetes, PM2, Heroku during normal shutdown.
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

// SIGINT — sent by Ctrl+C during local development.
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// unhandledRejection — a Promise was rejected and nobody caught it.
// Without this, Node.js would silently swallow the error (pre-Node 15)
// or crash without a useful message (Node 15+).
process.on("unhandledRejection", (reason, promise) => {
  console.error("💥  UNHANDLED PROMISE REJECTION:", reason);
  console.error("   At promise:", promise);
  // Initiate graceful shutdown — treat unhandled rejections as fatal.
  gracefulShutdown("unhandledRejection");
});

// uncaughtException — a synchronous throw that nobody caught.
// This is a programming bug. Log it and exit — the process state
// is now unpredictable and it's unsafe to continue.
process.on("uncaughtException", (err) => {
  console.error("💥  UNCAUGHT EXCEPTION:", err.message);
  console.error(err.stack);
  gracefulShutdown("uncaughtException");
});

// ─────────────────────────────────────────────────────────────
// Start the application
// ─────────────────────────────────────────────────────────────
bootstrap();
