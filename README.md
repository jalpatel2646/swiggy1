# 🛒 Amazon E-commerce Orders Management Backend API System

![Banner](https://via.placeholder.com/1200x300.png?text=Amazon+Orders+Management+Backend+API)

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js" />
  <img src="https://img.shields.io/badge/Express.js-404D59?style=for-the-badge" alt="Express.js" />
  <img src="https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
  <img src="https://img.shields.io/badge/JWT-black?style=for-the-badge&logo=JSON%20web%20tokens" alt="JWT" />
  <img src="https://img.shields.io/badge/Postman-FF6C37?style=for-the-badge&logo=postman&logoColor=white" alt="Postman" />
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="License" />
</p>

## 📖 Project Overview

The **Amazon E-commerce Orders Management Backend API System** is a robust, highly scalable, and production-ready backend designed to handle complex order lifecycles for an e-commerce platform. It provides a comprehensive set of RESTful APIs for managing users, handling authentication, processing orders, advanced searching and filtering, and generating detailed analytics and statistics.

Built with **Node.js, Express.js, and MongoDB**, it embraces best practices such as MVC architecture, Service Layer pattern, role-based access control (RBAC), and centralized error handling to ensure high maintainability and enterprise-grade performance.

---

## ✨ Features

- **Advanced Authentication & Authorization**: Secure JWT-based authentication, role-based access control, OTP verification, and password reset functionalities.
- **Comprehensive Order Management**: Full CRUD operations for orders, including order history, archiving/restoring, duplication, and invoice generation.
- **Robust Search & Filtering**: Fuzzy search, autocomplete, and extensive filtering by status, category, date, price, and location.
- **Pagination & Sorting**: Efficient data retrieval using dynamic pagination and multi-field sorting.
- **In-depth Analytics & Statistics**: Insights into revenue, top products, top customers, and performance statistics.
- **Shipping Management**: Shipment tracking, status updates, delivery estimation, and address management.
- **Admin & Bulk Operations**: Powerful admin controls for user management, bulk operations (create, update, delete, archive), and system monitoring.

---

## 🛠 Tech Stack

| Category | Technologies |
| :--- | :--- |
| **Runtime Environment** | Node.js |
| **Web Framework** | Express.js |
| **Database** | MongoDB, Mongoose |
| **Security & Auth** | JWT, bcrypt |
| **Validation** | Joi |
| **API Testing** | Postman |

---

## 🏗 Architecture Overview

### MVC Architecture
The system strictly adheres to the **Model-View-Controller (MVC)** architectural pattern adapted for API design (Model-Route-Controller-Service):
- **Models**: Defines MongoDB schemas and data constraints using Mongoose.
- **Controllers**: Handles incoming HTTP requests, validates inputs, and coordinates with services to send standardized JSON responses.

### Service Layer Explanation
To ensure business logic is completely decoupled from HTTP request handling, a **Service Layer** is implemented. 
- Controllers delegate data processing and business rules to Services.
- This promotes code reusability (e.g., calling an `OrderService` from both an API route and a cron job) and simplifies unit testing.

### Folder Structure
```text
📦 amazon_orders_jal_patel
 ┣ 📂 backend
 ┃ ┣ 📂 src
 ┃ ┃ ┣ 📂 config          # Environment and database configurations
 ┃ ┃ ┣ 📂 controllers     # Request handlers
 ┃ ┃ ┣ 📂 middlewares     # Custom reusable middlewares (Auth, Error Handler, etc.)
 ┃ ┃ ┣ 📂 models          # Mongoose schemas
 ┃ ┃ ┣ 📂 routes          # Express API route definitions
 ┃ ┃ ┣ 📂 services        # Core business logic layer
 ┃ ┃ ┣ 📂 utils           # Helper functions (Standard responses, tokens, logger)
 ┃ ┃ ┣ 📂 validations     # Joi validation schemas
 ┃ ┃ ┗ 📜 app.js          # Express app setup
 ┃ ┣ 📜 server.js         # Entry point for the Node server
 ┃ ┣ 📜 .env.example      # Environment variables template
 ┃ ┗ 📜 package.json      # Dependencies and npm scripts
```

### Folder Responsibilities
- **`controllers/`**: Extracts data from requests and passes it to the relevant service.
- **`services/`**: Contains the core logic. Performs database operations and applies business rules.
- **`middlewares/`**: Handles request interception (e.g., verify JWT, check roles, validate payloads).
- **`models/`**: Data abstraction.
- **`validations/`**: Ensures data integrity before reaching the controller.

---

## 🗄 Database Design

### Collections Overview

1. **Users**: Stores customer and admin profiles, hashed passwords, roles, and status.
2. **Orders**: Contains order details, items purchased, total amount, shipping addresses, and status history.
3. **Products** (Referenced): Represents items available in the catalog.
4. **Shipments**: Tracks the delivery lifecycle of an order.
5. **Invoices**: Stores generated billing documents linked to orders.

---

## 🔄 Request Lifecycle

1. **Client Request**: An API call is made to a specific endpoint.
2. **Route matching**: Express router directs it to the appropriate route.
3. **Middleware Execution**: 
   - Global middlewares (CORS, Morgan logger, Body parser).
   - Auth middleware (Verifies JWT and User Role).
   - Validation middleware (Validates payload using Joi).
4. **Controller**: Receives the validated request and passes data to the Service.
5. **Service**: Executes business logic and interacts with the Database (MongoDB via Mongoose).
6. **Response**: The Controller returns a standardized formatted API response or passes an error to the Global Error Handler.

### Authentication Flow
- User logs in providing credentials.
- `bcrypt` compares the hashed password.
- If successful, a JWT (JSON Web Token) is generated and returned.
- Client passes this token in the `Authorization` header (`Bearer <token>`) for subsequent protected requests.

### Authorization Flow
- Protected routes use a middleware to decode the JWT.
- It attaches the user payload to `req.user`.
- Role-based middleware (`authorizeRoles('admin')`) checks if `req.user.role` has the required permissions before proceeding.

---

## 🧩 API Modules

### 1. Authentication & Authorization
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Authenticate user & get token
- `POST /api/auth/logout` - Invalidate user session
- `POST /api/auth/forgot-password` - Trigger password reset OTP
- `POST /api/auth/reset-password` - Reset password

### 2. Order Management
- `POST /api/orders` - Create a new order
- `GET /api/orders/:id` - Get order details and summary
- `PUT /api/orders/:id/cancel` - Cancel an order
- `POST /api/orders/:id/duplicate` - Duplicate a past order
- `GET /api/orders/:id/invoice` - Generate order invoice

### 3. Search System
Implements Keyword Search, Fuzzy Search, and Autocomplete.
- `GET /api/orders/search?keyword=laptop`
- `GET /api/orders/search?customer=john`

### 4. Filtering System
Extensive querying capabilities.
- `GET /api/orders?status=DELIVERED&payment=PAID`
- `GET /api/orders?price[gte]=100&price[lte]=500`
- `GET /api/orders?date[from]=2023-01-01&date[to]=2023-12-31`

### 5. Pagination & Sorting
- `GET /api/orders?page=1&limit=20` (Dynamic Pagination)
- `GET /api/orders?sort=-createdAt` (Date Sorting descending)
- `GET /api/orders?sort=amount` (Amount Sorting ascending)

### 6. Analytics & Reporting
- `GET /api/analytics/revenue/monthly` - Monthly Revenue breakdown
- `GET /api/analytics/top-customers` - Top Customers by spend
- `GET /api/analytics/top-products` - Top Products by sales volume

### 7. Statistics Module
- `GET /api/statistics/daily` - Daily operational statistics
- `GET /api/statistics/shipping` - Shipping performance metrics

### 8. Shipping Management
- `GET /api/shipments/:orderId/track` - Shipment tracking
- `PUT /api/shipments/:id/status` - Shipment status updates

### 9. Admin Management
- `GET /api/admin/users` - User Management
- `PUT /api/admin/users/:id/ban` - Ban/Unban Users
- `GET /api/admin/system/health` - Health Checks

### 10. Bulk Operations
- `POST /api/orders/bulk` - Bulk Create
- `PUT /api/orders/bulk-update` - Bulk Update

---

## 🛡 Security & Best Practices

### Validation Strategy
- **Joi Validation**: All incoming request bodies, params, and queries are strictly validated before hitting the controllers.
- Prevents NoSQL Injection and ensures data consistency.

### Error Handling Strategy
- **Global Error Handler**: A centralized middleware catches all errors.
- **Async Error Wrapper**: Eliminates `try...catch` blocks in controllers by wrapping async functions.
- **Standardized API Responses**: All responses (success or error) follow a consistent JSON structure.

### Logging Strategy
- **Morgan Logger**: Intercepts HTTP requests and logs them to the console for monitoring.
- Error logs capture detailed stack traces in the development environment.

### Optimization Techniques
- **MongoDB Indexing Strategy**: Compound and single-field indexes are applied to frequently queried fields (`status`, `customerId`, `createdAt`) to optimize read performance.
- Queries are projected to return only necessary fields.

---

## 🚀 Getting Started

### Local Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jalpatel2646/amazon_orders_jal_patel.git
   cd amazon_orders_jal_patel/backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory based on `.env.example`:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/amazon_orders
   JWT_SECRET=your_super_secret_jwt_key
   JWT_EXPIRE=30d
   ```

4. **Run the Project:**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

### NPM Scripts
- `npm start`: Starts the application using Node.
- `npm run dev`: Starts the application with Nodemon for hot-reloading.
- `npm run seed`: Populates the database with initial dummy data.

---

## 📝 API Examples

### Standard API Response Format

**Success Response:**
```json
{
  "success": true,
  "message": "Order retrieved successfully",
  "data": {
    "_id": "64b1f...",
    "totalAmount": 150.00,
    "status": "PROCESSING"
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation Error",
  "message": "\"totalAmount\" is required"
}
```

---

## 🧪 Postman Testing Guide

1. Import the provided **Postman Collection** (`Amazon_Orders_API.postman_collection.json` if available).
2. Set up an environment with `{{baseUrl}}` pointing to `http://localhost:5000/api`.
3. Hit the `/auth/login` endpoint to obtain a token.
4. Set the token as a Bearer Token in Postman authorization settings to access protected routes.

---

## ☁️ Deployment Guide

The application is prepared for production deployment (AWS, Heroku, Render, etc.).
- Ensure `NODE_ENV=production`.
- Provide secure environment variables.
- Ensure the MongoDB cluster allows connections from the deployment server's IP.

---

## 🌿 Git Workflow

- **Branching Strategy**: 
  - `main`: Production-ready code.
  - `develop`: Integration branch for features.
  - `feature/feature-name`: New features.
- **Commit Convention**: Conventional Commits (e.g., `feat: add order search`, `fix: pagination bug`).

---

## 📈 Scalability Considerations & Future Improvements

- Implement Redis caching for analytics and high-read endpoints.
- Introduce Message Queues (RabbitMQ/Kafka) for asynchronous email notifications and invoice generation.
- Microservices transition for the Search and Analytics modules.

---

## 🎓 Learning Outcomes

Developing this system deepened expertise in:
- Designing scalable enterprise-grade backend architectures.
- Managing complex relationships in MongoDB.
- Implementing advanced filtering and querying mechanisms.
- Building reusable software components and standardizing API responses.

---

## 👨‍💻 Author

**Jal Patel**
- GitHub: [@jalpatel2646](https://github.com/jalpatel2646)

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.