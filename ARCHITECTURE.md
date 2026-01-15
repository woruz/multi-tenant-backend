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