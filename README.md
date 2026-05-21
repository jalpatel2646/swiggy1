# Amazon E-commerce Orders Management Backend API

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)

A highly scalable, production-ready RESTful API backend engineered to handle complex Amazon-style e-commerce order lifecycles, advanced shipping logistics, and secure administrative operations.

Designed with **Domain-Driven MVC**, a strict **Service Layer architecture**, and extensive **MongoDB optimizations** (compound indexing, bulk operations, and `.lean()` projection memory management).

---

## ⚡ Core Features & Systems

- **Advanced Order Logistics:** Full lifecycle management including status timelines, automated invoices, re-ordering, cancellations, and soft-archiving.
- **Enterprise Bulk Operations:** Native MongoDB `insertMany` and `bulkWrite` implementations handling thousands of concurrent updates with internal memory threshold constraints.
- **Shipping & Carrier Integration:** Matrix estimations, dynamic ETAs avoiding weekends, automated label number generation, and tracking checkpoints for USPS, FedEx, UPS, and DHL.
- **Zero-Trust Security & RBAC:** Granular JWT role enforcement, specific admin lockout protections, and an independent tamper-evident JSON audit logger tracking IP footprint on state mutations.
- **Centralized Validation & Errors:** Decoupled `Joi` middleware schemas protecting all endpoints from NoSQL injection, backed by a unified HTTP `ApiError` handler returning standard JSON shapes.
- **Deep Analytics Pipelines:** Native MongoDB aggregation pipelines computing gross revenue, net margins, shipping fees, and granular time-bucketed sales reports.

---

## 🏗️ Architecture & Stack

### Technology Stack
- **Runtime:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas
- **ODM:** Mongoose
- **Validation:** Joi
- **Security:** bcryptjs, jsonwebtoken, CORS
- **Logging:** Morgan, Custom Audit Logger

### Directory Structure
```
backend/
├── logs/                   # Secure audit logs directory
├── scripts/                # Database seeders (dev/prod)
├── src/
│   ├── config/             # DB connection, Env validations
│   ├── controllers/        # Thin HTTP handlers
│   ├── middlewares/        # JWT Auth, Joi Validation, Error catch
│   ├── models/             # Mongoose schemas & Pre-save hooks
│   ├── routes/             # Express routers (Zero-trust layout)
│   ├── services/           # Heavy lifting, Aggregations, DB ops
│   ├── utils/              # QueryBuilders, Invoice Gen, ApiError
│   ├── app.js              # Express app initialization
│   └── server.js           # Server boot & Graceful Shutdown
├── Dockerfile              # Multi-stage production container
└── package.json
```

---

## 🚀 Quick Start (Local Development)

### 1. Environment Setup
Clone the repository and install dependencies:
```bash
git clone https://github.com/jalpatel2646/amazon_orders_jal_patel.git
cd amazon_orders_jal_patel/backend
npm install
```

Copy the environment template:
```bash
cp .env.example .env
```
Ensure you insert your local or MongoDB Atlas `MONGO_URI` and a random string for `JWT_SECRET`.

### 2. Database Seeding
To quickly inject dummy users (Admin & Customer) and a sample order:
```bash
npm run seed
```
*(To wipe the database, run `npm run seed:destroy`)*

### 3. Start the Server
```bash
# Development mode (auto-reload)
npm run dev

# Production mode
npm start
```
The API will be available at `http://localhost:5000/api/v1/health`.

---

## 📦 Postman Testing & API Documentation

A comprehensive **API_DOCUMENTATION.md** is included in the `backend/` directory, detailing how to set up Postman environments and dynamic authentication scripts.

The system is broken down into the following namespaces:
1. **`/api/v1/auth`**: Registration, Login, and Profile management.
2. **`/api/v1/orders`**: Core CRUD operations and Advanced Sub-resources (Invoices, Summaries, Duplication).
3. **`/api/v1/orders/bulk`**: High-performance batch creation, status updates, and deletion.
4. **`/api/v1/shipping`**: Carrier estimations, labels, tracking timelines, and delivery routing.
5. **`/api/v1/admin`**: Deep system telemetry (Memory/CPU/Mongo State), audit logs, and revenue analytics.

---

## 🛳️ Production Deployment

This backend is optimized for horizontal scaling across Docker containers (AWS ECS, Google Cloud Run) or simple Platform-as-a-Service environments (Heroku, Render).

### 1. Graceful Shutdown
The application listens for `SIGTERM` and `SIGINT`. During a scaling event or deployment, it cleanly drops incoming connections and finishes processing in-flight requests before safely closing the MongoDB pool.

### 2. Docker
A highly optimized, multi-stage `Dockerfile` is included. It uses `node:18-alpine` and strips `devDependencies` before runtime, drastically reducing image size and attack surface.
```bash
# Build the image
docker build -t amazon-backend .

# Run the container
docker run -p 5000:5000 --env-file .env amazon-backend
```

### 3. Production Environment Variables (`.env.production`)
When deploying, ensure the following are set natively in your host environment:
- `NODE_ENV=production` *(Disables verbose stack traces and triggers Morgan's 'combined' IP-logging mode).*
- `ALLOWED_ORIGINS=https://your-frontend-domain.com` *(Hardens CORS).*
- `JWT_SECRET` *(Use `openssl rand -base64 32` for production).*

---

## 🛡️ Operations & Security Posture
- **Lockout Prevention:** Administrative role endpoints include mathematical checks to prevent the demotion or banning of the last active administrator.
- **Log Streaming:** Audit events (`backend/logs/admin_audit.log`) are exposed via an administrative-only endpoint with pagination to prevent massive file reads.
- **Max Constraints:** Bulk operations are hard-capped at 1,000 JSON objects via Joi to prevent CPU/Memory exhaustion during parsing.
- **Lean Queries:** All read-only `.find()` queries utilize `.lean()` mappings to remove the `MongooseDocument` wrapper, radically dropping garbage collection pressure.

---
*Architected and developed by Jal Patel.*