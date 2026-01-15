# 🚀 Multi-Tenant Inventory Management System

A SaaS backend system where multiple businesses (tenants) manage inventory, suppliers, purchase orders, and orders independently with strong data isolation and concurrency safety.

This project focuses on clean system design, correctness under concurrent operations, and real-world inventory workflows rather than UI polish.

## Tech Stack

### Backend
---
Node.js + Express
MongoDB + Mongoose
Redis (distributed locking)
Socket.io (real-time updates)
JWT Authentication
Role-Based Access Control
---
### Frontend
---
React (Hooks)
Context API / Redux
React Router
Real-time updates via Socket.io
---

## Core Features
### Multi-Tenancy

Row-level tenant isolation using tenantId
Each tenant has:
---
    Its own users
    Inventory
    Suppliers
    Orders 
---
Enforced via JWT + middleware

### Authentication & Roles

JWT-based authentication

Roles:
---
    OWNER
    MANAGER
    STAFF  
---
Role-based route protection

### Inventory Management

Products with multiple variants (SKUs)

Each variant tracks:
---
    Stock
    Price
    Reorder level 
---
Full stock movement audit trail:
---
    Purchase
    Sale
    Adjustment
    Return 
---
### Orders & Concurrency Safety

Atomic order placement

Prevents overselling under concurrent requests

Guarantees stock never goes negative

#### How it works:

Redis distributed locks per variant

MongoDB transactions

Atomic stock decrement ($gte checks)

### Suppliers & Purchase Orders

Supplier management with pricing

Purchase Orders with:
---
    Multiple items
    Partial deliveries
    Status lifecycle: 
    ```bash
    DRAFT → SENT → CONFIRMED → RECEIVED
    ```
---

Stock is updated only when items are received

Redis locks prevent duplicate PO receiving

### Smart Low-Stock Alerts
Considers:
---
    Current stock
    Reorder level
    Pending Purchase Orders
---
Avoids false alerts when replenishment is already in progress

### Real-Time Updates

Socket.io emits stock updates on:
---
    Order placement
    Purchase Order receiving 
---
Tenant-scoped channels ensure isolation

### Dashboard & Analytics

Inventory value

Low-stock items

Top 5 selling variants (last 30 days)

Stock movement graph (last 7 days)

Optimized aggregation queries

Designed to load in <2 seconds with 10,000+ variants

## Project Structure

```bash
src/
├── controllers/
├── routes/
├── models/
├── services/
├── middlewares/
├── utils/
├── sockets/
└── app.js
```

## Setup Instructions
### Prerequisites
```bash
Node.js >= 18
MongoDB (local or Atlas)
Redis
```

### Backend Setup

```bash
git clone https://github.com/woruz/multi-tenant-backend.git
cd multi-tenant-backend
npm install
```

### Create .env file using .env.example
```bash
PORT=4000
MONGO_URI=mongodb://localhost:27017/inventory
JWT_SECRET=your_secret
REDIS_URL=redis://localhost:6379
```

Start server:
```bash
npm run dev
```

## Seed Data

A seed script creates:
---
    2 tenants

    Multiple users with different roles

    Sample products, variants, and suppliers
---

```bash
npm run seed
```

## Test Credentials
---
Tenant 1

Owner: owner1@test.com

Manager: manager1@test.com

Staff: staff1@test.com

Password: password123
---

---
Tenant 2

Owner: owner2@test.com

Password: password123
---