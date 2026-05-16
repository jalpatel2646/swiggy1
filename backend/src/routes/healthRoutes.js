/**
 * @file healthRoutes.js
 * @description Health check endpoint for the API.
 *
 * WHY A HEALTH CHECK ROUTE:
 * Health check routes are a production necessity. They allow:
 *  - Load balancers (AWS ELB, GCP LB) to know if the instance is alive.
 *  - Container orchestration (Docker, Kubernetes) to decide when to restart.
 *  - Uptime monitoring tools (UptimeRobot, Pingdom) to verify availability.
 *  - CI/CD pipelines to confirm a deployment succeeded before routing traffic.
 *
 * This is always the first route you add — it confirms the server is running
 * without depending on any other system (DB, auth, etc.).
 */

"use strict";

const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

/**
 * @route   GET /api/health
 * @desc    Returns the live status of the API and its DB connection.
 * @access  Public
 */
router.get("/", (req, res) => {
  // mongoose.connection.readyState values:
  //   0 = disconnected | 1 = connected | 2 = connecting | 3 = disconnecting
  const dbStates = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };

  const dbStatus = dbStates[mongoose.connection.readyState] || "unknown";

  res.status(200).json({
    success: true,
    message: "Amazon Orders API is operational.",
    data: {
      environment: process.env.NODE_ENV || "development",
      apiVersion: "v1",
      timestamp: new Date().toISOString(),
      uptime: `${Math.floor(process.uptime())}s`,
      database: {
        status: dbStatus,
        host:
          mongoose.connection.host || "not connected",
      },
    },
  });
});

module.exports = router;
