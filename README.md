# Amazon E-commerce Orders Management Backend API System

![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)
![Mongoose](https://img.shields.io/badge/Mongoose-880000?style=for-the-badge&logo=mongoose&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=JSON%20web%20tokens&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Postman](https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white)

## 2. Project Overview
The **Amazon E-commerce Orders Management Backend** is an enterprise-grade, highly scalable RESTful API built on Node.js and MongoDB. It handles the complete lifecycle of e-commerce orders, mimicking the architectural complexity of modern logistics platforms like Amazon. It features advanced order processing, bulk operations, deep shipping logistics, native database aggregations for revenue tracking, and a zero-trust administrative security model.

## 3. Project Objective
The objective of this project is to construct a production-ready, highly optimized backend architecture capable of serving enterprise loads. It demonstrates a strict decoupling of business logic via a Service Layer architecture, advanced MongoDB optimizations (lean queries, compound indexing), and secure, centralized error and validation handling.

## 4. Features Overview
- **Advanced Order Logistics:** Full lifecycle management including statuses, automated invoices, re-ordering, cancellations, and soft-archiving.
- **Enterprise Bulk Operations:** Native MongoDB batch processing to handle thousands of concurrent mutations efficiently.
- **Shipping Integration:** Delivery routing matrices, weekend-aware ETAs, label generation, and step-by-step tracking trails.
- **Zero-Trust RBAC:** Granular JWT role enforcement, lockout prevention, and tamper-evident administrative audit logging.
- **Centralized Middleware:** Unified Joi schema validation protecting endpoints from NoSQL injection, backed by a unified HTTP `ApiError` handler.
- **Analytics Pipelines:** Native MongoDB aggregation pipelines computing gross revenue, net margins, and time-bucketed sales reports.

## 5. Tech Stack
- **Runtime Environment:** Node.js (v18+)
- **Framework:** Express.js
- **Database:** MongoDB Atlas (NoSQL)
- **ODM:** Mongoose
- **Validation:** Joi
- **Security:** bcryptjs (password hashing), jsonwebtoken (JWT)
- **Logging & Monitoring:** Morgan, custom JSON file auditing
- **Containerization:** Docker

## 6. Backend Architecture
The backend employs a modern **Domain-Driven Design (DDD)** combined with a strict **MVC (Model-View-Controller)** and **Service Layer** separation. This ensures maximum maintainability, testability, and scalability. Route definitions are isolated from request extraction, which is in turn isolated from database logic.

## 7. MVC Architecture Explanation
While standard MVC (Model-View-Controller) dictates the flow of data, APIs inherently lack a traditional "View". In this architecture, the "View" is replaced by a standardized JSON output formatted by centralized response utilities. The **Model** strictly governs data shape and lifecycle hooks, while the **Controller** acts exclusively as an HTTP traffic director.

## 8. Service Layer Explanation
To prevent "Fat Controllers" (controllers overloaded with Mongoose queries), all business logic is offloaded to the **Service Layer** (`src/services`). Controllers extract HTTP data (`req.body`, `req.params`) and pass it to pure JavaScript Service functions. This makes the logic heavily reusable; a service function can be triggered by a controller, a cron job, or an internal bulk script seamlessly.

## 9. Folder Structure
```text
backend/
├── logs/                   # Secure audit log output directory
├── scripts/                # Database seeding & destruction utilities
├── src/
│   ├── config/             # Environment validation & DB connection
│   ├── controllers/        # Thin HTTP handlers
│   ├── middlewares/        # JWT Auth, Joi Validation, Global Error Catch
│   ├── models/             # Mongoose schemas & Pre-save hooks
│   ├── routes/             # Express routers (Zero-trust layout)
│   ├── services/           # Heavy lifting, Aggregations, DB ops
│   ├── utils/              # QueryBuilders, Invoice Gen, ApiError, Responses
│   ├── app.js              # Express app initialization & Middleware stack
│   └── server.js           # Server boot & Graceful Shutdown
├── .dockerignore           # Container optimization
├── .env.example            # Environment variables template
├── API_DOCUMENTATION.md    # Postman integration guide
├── Dockerfile              # Multi-stage production container
└── package.json            # Dependencies & npm scripts
```

## 10. Folder Responsibilities
- **`config/`**: Centralizes and validates `.env` variables ensuring the app crash-fails early if misconfigured.
- **`controllers/`**: Extracts HTTP payloads, calls services, and wraps output in standard JSON.
- **`middlewares/`**: Intercepts requests for authentication, validation, and error routing.
- **`models/`**: Defines schemas, indexes, and automated state-transition hooks.
- **`routes/`**: Maps URL paths to controllers and applies route-specific middleware.
- **`services/`**: Executes Mongoose operations, bulk processing, and data aggregations.
- **`utils/`**: Reusable generic logic (QueryBuilder, API Responses, Audit Logging).

## 11. Request Lifecycle
1. **Client Request** arrives at Node.js Express server.
2. **Global Middleware** logs the request (Morgan) and parses JSON.
3. **Route Matching** directs traffic to the appropriate namespace (`/api/v1/orders`).
4. **Auth Middleware** verifies JWT and Role constraints.
5. **Validation Middleware** verifies payload against Joi schemas.
6. **Controller** extracts sanitized data and invokes the Service.
7. **Service** executes optimized Mongoose queries.
8. **Controller** wraps the result in `ApiResponse` and sends HTTP 200/201.

## 12. Middleware Flow
Requests pass through a strict pipeline:
`morgan` -> `express.json` -> `protect` (JWT Check) -> `restrictTo(Role)` -> `validate(Joi Schema)` -> **Controller**. If any step fails, `next(error)` routes the failure instantly to the `globalErrorHandler` bypassing the rest of the application.

## 13. Database Design
The MongoDB database is optimized for both heavy read operations (dashboards) and consistent write operations (order creation). We employ **Snapshotting** over **Referencing** for order items and shipping addresses—meaning product prices are hard-copied into an order. If a product price changes tomorrow, the historical order retains the exact price paid at the time of purchase.

## 14. Collections Overview
- **Users**: Authentication credentials, roles, and active status.
- **Orders**: Embedded snapshots of purchased items, shipping addresses, monetary calculations, and historical state transitions.
- **Shipments**: Carrier information, tracking IDs, delivery notes, and delivery checkpoint arrays.

## 15. Relationships
- **Order to User**: `1:N` Reference (`ObjectId`). Indexed for blazing fast "My Orders" retrieval.
- **Order to Product**: `1:N` Embedded Snapshot. Products are copied into `orderItems` at checkout.
- **Shipment to Order**: `1:1` Reference. Separated to keep Order documents lightweight during financial analytics.

## 16. Authentication Flow
Authentication uses stateless JWTs. 
1. Client submits `POST /auth/login`.
2. Service verifies bcrypt password hash.
3. Service generates a signed JWT payload containing `{ id: userId }`.
4. Client stores the token and includes it in the `Authorization: Bearer <token>` header for subsequent requests.

## 17. JWT Security Flow
The `protect` middleware intercepts incoming requests:
1. Extracts the Bearer token.
2. Verifies the cryptographic signature using `JWT_SECRET`.
3. Checks if the user still exists in the database.
4. Checks if the user changed their password *after* the token was issued (rejecting hijacked tokens).
5. Appends the full user document to `req.user`.

## 18. Role-Based Access Control
The `restrictTo(...roles)` middleware evaluates `req.user.role`. Administrative endpoints strictly demand the `"admin"` role. The system implements a mathematical self-lockout guard preventing an admin from demoting or banning themselves if they are the sole administrator in the database.

## 19. API Categories
APIs are structurally grouped by domain:
- `Auth`: Registration, Login, Profile.
- `Orders`: Core CRUD and customer workflows.
- `Orders Bulk`: High-performance batch processing.
- `Shipping`: Carrier logistics and tracking.
- `Admin`: System telemetry and revenue aggregation.

## 20. CRUD APIs
Standard operations mapping to HTTP Verbs:
- `POST` creates resources.
- `GET` retrieves resources (lists or singles).
- `PATCH` applies partial updates.
- `DELETE` removes resources.

## 21. Search & Filtering System
Powered by `QueryBuilder.js`, the API accepts dynamic URL queries.
- **Equality/Range:** `?price[gte]=100&status=shipped`
- **Regex Search:** `?search=headphones` (automatically maps to case-insensitive regex against predefined model fields).

## 22. Pagination & Sorting
- **Pagination:** `?page=2&limit=50` controls skip/limit math automatically.
- **Sorting:** `?sort=-createdAt,price` resolves directly to Mongoose sort parameters.
- **Projection:** `?fields=name,price` strips out heavy embedded arrays to save bandwidth.

## 23. Aggregation & Analytics
Administrative reports utilize native MongoDB `$group`, `$match`, and `$project` pipelines. By calculating gross sales, net revenues, and average order values natively in C++ on the database engine, we avoid transferring gigabytes of raw JSON to Node.js for processing.

## 24. Shipping Management
The shipping service layer handles highly customized logic:
- Carrier matching (UPS, FedEx, USPS).
- Weekend-aware delivery estimation dates.
- Internal automated tracking checkpoints generated dynamically whenever a shipment's status shifts.

## 25. Admin Management
Provides zero-trust visibility into the platform:
- Server telemetry (RAM, CPU load, Node process ID, uptime).
- Secure paginated streaming of the internal JSON audit log (`logs/admin_audit.log`).
- Advanced user management including ban/unban toggles.

## 26. Bulk Operations
Located at `/api/v1/orders/bulk`, these endpoints leverage:
- `Model.insertMany({ ordered: false })` for massive data imports.
- `Model.bulkWrite()` for distinct multi-document updates in a single network trip.
- `Model.updateMany()` for sweeping archive/restore operations.

## 27. Validation System
Joi dictates strict data types, boundaries, and formats. Bulk endpoints restrict payloads to a maximum of `1000` array elements, neutralizing payload-bombing DDoS attempts that would otherwise stall the single-threaded Node.js event loop.

## 28. Logging System
- **Morgan:** Intercepts HTTP traffic. Configured dynamically to output colorful `"dev"` logs locally, and verbose Apache-style `"combined"` logs (capturing IPs and User Agents) in production.
- **Audit Logger:** A specialized file-system logger writes non-repudiable JSON entries for every administrative mutation (bans, role changes, bulk operations).

## 29. Error Handling Strategy
Controllers are wrapped in a `catchAsync` higher-order function, completely eliminating `try/catch` block bloat. Any thrown `ApiError` is caught by the `globalErrorHandler`, which strips stack traces in production and unifies output to a predictable `{"status": "error", "message": "..."}` shape.

## 30. Optimization Strategies
- **Lean Queries:** All read-only list endpoints call `.lean()` via the `QueryBuilder`, stripping the heavy Mongoose document wrappers and returning raw POJOs. This drops memory consumption drastically.
- **Compound Indexing:** Databases enforce multi-key indexes (`{ status: 1, createdAt: -1 }`) allowing instant filtering and chronological sorting of millions of records without linear scanning.

## 31. Security Best Practices
- Passwords are never returned in queries (`select: false`).
- MongoDB Injection is mitigated by Joi schema sanitization enforcing exact 24-character ObjectIds.
- Deep system telemetry is strictly fenced behind `restrictTo("admin")`.
- JWT Tokens are stateless and verified via cryptographically secure HMAC SHA-256.

## 32. Environment Variables Setup
Create a `.env` file at the root of the `/backend` directory:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0...
JWT_SECRET=super_secret_key_change_me
JWT_EXPIRES_IN=7d
ALLOWED_ORIGINS=http://localhost:3000
```

## 33. Installation Guide
```bash
git clone https://github.com/jalpatel2646/amazon_orders_jal_patel.git
cd amazon_orders_jal_patel/backend
npm install
```

## 34. MongoDB Setup
Ensure you have a MongoDB Atlas account. Create a new cluster, retrieve your connection string, replace `<password>` with your database user's password, and insert it into your `.env` file.

## 35. Running the Server
```bash
# Run in development with Nodemon auto-reloading
npm run dev

# Run in production mode
npm start
```

## 36. npm Scripts
- `npm start`: Boots the production server.
- `npm run dev`: Boots the development server with live-reloading.
- `npm run seed`: Injects dummy users and orders into the database.
- `npm run seed:destroy`: Wipes the entire database clean.
- `npm run lint`: Runs ESLint across all source files.

## 37. API Response Structure
Every endpoint guarantees a consistent standard response format:
```json
{
  "status": "success",
  "message": "Operation completed successfully.",
  "data": { ... }
}
```

## 38. Postman Testing
Refer to the `API_DOCUMENTATION.md` file located in the `/backend` directory for instructions on setting up Postman Environments and dynamic pre-request scripts to automatically capture and append your Bearer token.

## 39. Deployment Preparation
The system features a multi-stage `Dockerfile`. 
To deploy via Docker:
```bash
docker build -t amazon-orders-api .
docker run -p 5000:5000 --env-file .env amazon-orders-api
```
The application handles internal graceful shutdown logic out-of-the-box (`SIGTERM`), ensuring active HTTP connections drain cleanly before the process exits during rolling deployments on AWS ECS, Google Cloud Run, or Kubernetes.

## 40. GitHub Workflow
Code is committed directly or via Pull Requests to the `main` branch. The repository maintains a clean linear history via rebase strategies.

## 41. Branching Strategy
- `main`: Represents the production-ready, stable deployable state.
- `feature/*`: Short-lived branches for isolated development of API modules (e.g. `feature/bulk-operations`).

## 42. Commit Message Convention
Commits follow the conventional commits standard:
- `feat(module):` New features.
- `fix(module):` Bug fixes.
- `chore(module):` Maintenance, configurations, or dependencies.
- `refactor(module):` Optimization without behavior changes.

## 43. Best Practices Followed
- Separation of Concerns (MVC + Service Layer).
- Fail-Fast configuration loading.
- Centralized Error Handling.
- Automated payload validation.
- RESTful HTTP Verb and Status Code semantic compliance.

## 44. Scalability Considerations
The API is completely stateless, meaning session data is not stored in Node.js memory. This allows the backend to be horizontally scaled to an infinite number of parallel container instances behind a Load Balancer.

## 45. Future Improvements
- Implement Redis caching for heavily hit administrative analytical queries.
- Migrate from simple audit files to a centralized logging system like ELK (Elasticsearch, Logstash, Kibana) or Datadog.
- Implement Webhooks for asynchronous order event broadcasting.

## 46. Learning Outcomes
This architecture demonstrates advanced comprehension of enterprise Node.js environments, including memory optimization via query projection, bypassing document wrappers via `.lean()`, mitigating denial-of-service vectors via payload validation limits, and designing stateless containerized deployments.

## 47. Author Section
Architected and developed by **Jal Patel**.

## 48. License Section
This project is licensed under the ISC License.