# 🚀 Book Management REST API  ARCHITECTURE

---
## 📌 1. Overview

This system is a multi-tenant SaaS platform that allows multiple businesses (tenants) to independently manage inventory, suppliers, purchase orders, and customer orders. The architecture prioritizes:

    Strong tenant data isolation

    Correctness under concurrent operations

    Full stock auditability

    Predictable performance at scale

The backend is built using Node.js, Express, MongoDB (Mongoose), Redis, and Socket.io. 
---

## 📌 2. Multi-Tenancy Strategy

### 2.1 Chosen Approach: Row-Level Multi-Tenancy

Each document in the database contains a tenantId field. All queries are scoped by tenantId, enforced at the middleware and service layer.

```bash
Example

Variant.find({ tenantId: req.tenantId })
```

Why This Approach
| Option                 | Pros                             | Cons                             |
| ---------------------- | -------------------------------- | -------------------------------- |
| Separate DB per tenant | Strong isolation                 | High operational complexity      |
| Schema per tenant      | Good isolation                   | Hard to scale dynamically        |
| **Row-level (chosen)** | Simple, scalable, cost-effective | Requires strict query discipline |


Enforcement
 ---
    tenantId is extracted from JWT

    Injected into req via middleware

    All models and services require tenantId
---
This approach is suitable for early-stage SaaS and supports horizontal scaling.

---

## 📌 3. Authentication & Authorization   

JWT-based authentication

JWT payload includes:

```bash
{ "userId": "...", "tenantId": "..." }
```
Role-based access control using roles:
---
    OWNER

    MANAGER

    STAFF
---
Authorization is enforced via middleware before route execution.

## 📌 4. Inventory Data Modeling  

## 4.1 Product & Variant Modeling

Products and variants are modeled as separate collections.

Product

```bash
{
  _id,
  tenantId,
  name,
  description
}
```
Variant

```bash
{
  _id,
  tenantId,
  productId,
  sku,
  attributes: { size, color },
  stock,
  reorderLevel,
  price
}
```

Why Separate Variant Collection

Each variant represents a sellable SKU

Enables independent stock tracking

Simplifies indexing and concurrency control

Avoids large nested arrays in Product documents

This allows modeling combinations like:

---

T-Shirt → 3 sizes × 3 colors = 9 SKUs

---

## 📌 5. Stock Movement Tracking

All stock changes are recorded in a StockMovement collection.

```bash
{
  tenantId,
  variantId,
  type: "PURCHASE" | "SALE" | "ADJUSTMENT" | "RETURN",
  quantity,
  orderId?,
  purchaseOrderId?,
  createdAt
}
```

Benefits

Full audit trail

Time-series analytics

Enables dashboard stock movement graphs

Stock values in Variant represent current state, while StockMovement represents history.


## 📌 6. Concurrency & Race Condition Handling  

### 6.1 Order Placement (Last Item Problem)


#### Problem:
Two users attempt to order the last available unit of a variant at the same time.

#### Solution:
A hybrid approach using Redis distributed locks and MongoDB atomic updates.

Flow

1:- Acquire Redis lock per variant:

``bash
lock:variant:<variantId>
```

2:- Start MongoDB transaction

3:- Atomically decrement stock using:

```bash
stock: { $gte: quantity }
```

4:- Create stock movement and order

5:- Commit transaction

6:- Release Redis locks

Why This Works
---
    Redis prevents concurrent attempts across instances

    MongoDB guarantees stock never becomes negative

    Transactions ensure rollback on failure
---
This design provides strong consistency and predictable behavior under load.

### 6.2 Purchase Order Receiving (Workflow Locking)

#### Problem:
Two users attempt to receive the same Purchase Order simultaneously, causing duplicate stock increments.

#### Solution:
Redis distributed lock at Purchase Order level.

```bash
lock:purchaseOrder:<purchaseOrderId>
```

Only one receive operation can proceed at a time.

MongoDB transactions are used to:

Update received quantities

Update variant stock

Insert stock movements

Update PO status (CONFIRMED / RECEIVED)

This ensures idempotent PO processing.

## 📌 7. Purchase Orders 

Purchase Orders support:

Multiple items (variants)

Partial deliveries

Price variance handling

Status lifecycle:

```bash
DRAFT → SENT → CONFIRMED → RECEIVED
```

## 📌 8. Dashboard & Analytics  

### 8.1 Key Metrics

Inventory value (stock × price)

Low-stock items (considering pending POs)

Top 5 selling variants (last 30 days)

Stock movement trend (last 7 days)

### 8.2 Performance Strategy

Aggregation pipelines using indexed fields

Pre-filtered by tenantId

Time-bounded queries

Lightweight projections

With proper indexing, dashboards load in <2 seconds with 10,000+ variants.

## 📌 9. Real-Time Updates 

Socket.io used for real-time stock updates

Events emitted on:
---
    Order placement

    Purchase Order receiving
---
```bash
stockUpdated:<tenantId>
```
Clients subscribe per tenant, ensuring isolation.

## 📌 10. Data Integrity Guarantees

Stock never becomes negative

All stock mutations occur inside transactions

Redis locks prevent duplicate workflows

All failures result in full rollback

## 📌 11. Scalability Considerations 

Stateless backend → horizontal scaling

Redis locks work across instances

Row-level multi-tenancy supports thousands of tenants

Can migrate high-value tenants to dedicated DBs later

## 📌 12. Trade-Offs & Future Improvements

### Current Trade-Offs
---
Redis adds operational complexity
---