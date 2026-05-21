# Amazon Orders API — Postman Configuration Guide

This document details how to configure Postman to test the backend locally and in production.

## 1. Environment Variables
Create a new Environment in Postman named `Amazon Local` and add the following variables:
- `URL`: `http://localhost:5000/api/v1`
- `TOKEN`: (Leave blank, will be set automatically via auth script)

## 2. Authentication Script (Pre-request/Tests)
To avoid copying and pasting JWT tokens manually, add the following script to the **Tests** tab of your `POST /auth/login` request:

```javascript
if (pm.response.code === 200) {
    const jsonData = pm.response.json();
    pm.environment.set("TOKEN", jsonData.data.token);
}
```

Then, set the **Authorization** tab of the root Postman Collection to `Bearer Token` and set the Token value to `{{TOKEN}}`. This automatically secures all downstream requests.

## 3. Core API Endpoints

### Health
- `GET {{URL}}/health` — Returns 200 OK and system uptime.

### Auth
- `POST {{URL}}/auth/register`
- `POST {{URL}}/auth/login`
- `GET {{URL}}/auth/me`

### Orders
- `POST {{URL}}/orders`
- `GET {{URL}}/orders` (Admin)
- `GET {{URL}}/orders/:id`
- `GET {{URL}}/orders/:id/exists`
- `GET {{URL}}/orders/:id/summary`
- `GET {{URL}}/orders/:id/history`
- `GET {{URL}}/orders/:id/invoice`
- `POST {{URL}}/orders/:id/cancel`
- `PATCH {{URL}}/orders/:id/archive` (Admin)

### Bulk Orders (Phase 9)
- `POST {{URL}}/orders/bulk/create`
- `PATCH {{URL}}/orders/bulk/status`

### Shipping (Phase 7)
- `GET {{URL}}/shipping/carriers`
- `GET {{URL}}/shipping/pending` (Admin)
- `GET {{URL}}/shipping/tracking/:orderId`
- `POST {{URL}}/shipping/create-label` (Admin)
- `PATCH {{URL}}/shipping/update-status/:orderId` (Admin)

### Admin (Phase 8)
- `GET {{URL}}/admin/system/health`
- `GET {{URL}}/admin/system/logs`
- `GET {{URL}}/admin/reports/sales?startDate=2026-01-01T00:00:00Z&endDate=2026-12-31T00:00:00Z`
- `GET {{URL}}/admin/users`
- `PATCH {{URL}}/admin/users/:id/role`
