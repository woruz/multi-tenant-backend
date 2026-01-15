require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Tenant = require("../src/models/Tenant");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Variant = require("../src/models/Variant");
const Supplier = require("../src/models/Supplier");
const PurchaseOrder = require("../src/models/PurchaseOrder");
const Order = require("../src/models/Order");
const StockMovement = require("../src/models/StockMovement");

const MONGO_URI = process.env.MONGO_URI;

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  // Clean DB
  await Promise.all([
    Tenant.deleteMany({}),
    User.deleteMany({}),
    Product.deleteMany({}),
    Variant.deleteMany({}),
    Supplier.deleteMany({}),
    PurchaseOrder.deleteMany({}),
    Order.deleteMany({}),
    StockMovement.deleteMany({})
  ]);

  // -----------------------------
  // 1. Create Tenants
  // -----------------------------
  const tenants = await Tenant.insertMany([
    { name: "Tenant A" },
    { name: "Tenant B" }
  ]);

  // -----------------------------
  // 2. Create Users
  // -----------------------------
  const users = [];
  for (const tenant of tenants) {
    users.push(
      await User.create({
        tenantId: tenant._id,
        name: "Owner",
        email: `owner@${tenant.name.replace(/\s/g, "").toLowerCase()}.com`,
        password: "password123",  
        role: "OWNER"
      })
    );
    users.push(
      await User.create({
        tenantId: tenant._id,
        name: "Manager",
        email: `manager@${tenant.name.replace(/\s/g, "").toLowerCase()}.com`,
        password: "password123",
        role: "MANAGER"
      })
    );
    users.push(
      await User.create({
        tenantId: tenant._id,
        name: "Staff",
        email: `staff@${tenant.name.replace(/\s/g, "").toLowerCase()}.com`,
        password: "password123",
        role: "STAFF"
      })
    );
  }

  // -----------------------------
  // 3. Create Suppliers
  // -----------------------------
  const suppliers = [];
  for (const tenant of tenants) {
    suppliers.push(
      await Supplier.create({
        tenantId: tenant._id,
        name: "Best Supplier",
        contactEmail: "supplier@example.com",
        contactPhone: "1234567890",
        address: "123 Supplier St."
      })
    );
  }

  // -----------------------------
  // 4. Create Products & Variants
  // -----------------------------
  const variants = [];

  for (const tenant of tenants) {
    // Example product: T-shirt with 3 sizes × 3 colors = 9 variants
    const product = await Product.create({
      tenantId: tenant._id,
      name: "T-Shirt",
      description: "Comfortable cotton t-shirt"
    });

    const sizes = ["S", "M", "L"];
    const colors = ["Red", "Blue", "Green"];

    for (const size of sizes) {
      for (const color of colors) {
        const variant = await Variant.create({
          tenantId: tenant._id,
          productId: product._id,
          sku: `TS-${size}-${color}`,
          attributes: { size, color },
          stock: Math.floor(Math.random() * 20) + 5, // random 5-25
          reorderLevel: 5,
          price: 20 + Math.floor(Math.random() * 10) // 20-30
        });
        variants.push(variant);
      }
    }
  }

  // -----------------------------
  // 5. Create Purchase Orders
  // -----------------------------
  for (const tenant of tenants) {
    const po = await PurchaseOrder.create({
      tenantId: tenant._id,
      supplierId: suppliers.find(s => s.tenantId.equals(tenant._id))._id,
      status: "DRAFT",
      items: variants
        .filter(v => v.tenantId.equals(tenant._id))
        .slice(0, 5)
        .map(v => ({
          variantId: v._id,
          quantityOrdered: 10,
          quantityReceived: 0,
          price: v.price
        }))
    });
  }

  // -----------------------------
  // 6. Create Orders
  // -----------------------------
  for (const tenant of tenants) {
    const order = await Order.create({
      tenantId: tenant._id,
      items: variants
        .filter(v => v.tenantId.equals(tenant._id))
        .slice(0, 3)
        .map(v => ({
          variantId: v._id,
          quantity: 2,
          price: v.price
        })),
      status: "PLACED"
    });

    // Record stock movement for orders
    for (const item of order.items) {
      await StockMovement.create({
        tenantId: tenant._id,
        variantId: item.variantId,
        type: "SALE",
        quantity: -item.quantity,
        orderId: order._id
      });
    }

    // Decrease stock
    for (const item of order.items) {
      await Variant.findByIdAndUpdate(item.variantId, { $inc: { stock: -item.quantity } });
    }
  }

  console.log("Database seeded successfully");
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
