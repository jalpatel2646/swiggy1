# ─────────────────────────────────────────────────────────────
# Amazon Orders API — Production Dockerfile
# ─────────────────────────────────────────────────────────────

# Stage 1: Build & Dependencies
FROM node:18-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies if needed for build)
RUN npm ci

# Copy application source code
COPY . .

# Stage 2: Production Runtime
FROM node:18-alpine

# Set to production to drastically optimize Node.js performance
ENV NODE_ENV=production

WORKDIR /usr/src/app

# Only copy over the production node_modules from builder (or reinstall prod only)
COPY package*.json ./
RUN npm ci --only=production

# Copy source code from builder
COPY --from=builder /usr/src/app/src ./src
COPY --from=builder /usr/src/app/server.js ./server.js

# Expose API Port
EXPOSE 5000

# Start Application
CMD ["node", "server.js"]
