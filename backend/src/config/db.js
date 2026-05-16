/**
 * @file db.js
 * @description MongoDB connection handler using Mongoose.
 *
 * WHY THIS IS SEPARATE FROM app.js:
 * Database connection logic has its own lifecycle (connect, disconnect,
 * reconnect on failure). Keeping it isolated:
 *  - Makes it easy to test in isolation.
 *  - Allows future swapping to a different database without touching app logic.
 *  - Prevents the "god file" anti-pattern in app.js or server.js.
 */

"use strict";

const mongoose = require("mongoose");
const config = require("./env");

/**
 * Establishes a connection to MongoDB using the URI from config.
 * Uses async/await for clean, readable control flow.
 * The caller (server.js) is responsible for handling the rejection.
 *
 * @returns {Promise<void>}
 */
const connectDB = async () => {
  // Mongoose 6+ no longer needs useNewUrlParser / useUnifiedTopology.
  // These options are now the default and passing them causes warnings.
  const options = {
    // Maximum time (ms) the connection can remain idle in the pool.
    // Prevents stale connections on MongoDB Atlas.
    serverSelectionTimeoutMS: 5000,

    // How long the driver waits before determining a server is unreachable.
    socketTimeoutMS: 45000,
  };

  const connection = await mongoose.connect(config.MONGO_URI, options);

  // Log only the host part, never the full URI (which contains credentials).
  console.log(
    `✅  MongoDB connected → ${connection.connection.host} ` +
      `[DB: ${connection.connection.name}]`
  );
};

/**
 * Mongoose global event listeners for monitoring connection health.
 * These fire throughout the application lifecycle, not just at startup.
 */
mongoose.connection.on("disconnected", () => {
  console.warn("⚠️   MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log("🔄  MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error(`❌  MongoDB connection error: ${err.message}`);
});

module.exports = connectDB;
