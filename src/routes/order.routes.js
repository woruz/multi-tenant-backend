const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");
const controller = require("../controllers/order.controller");

router.post("/", auth, tenant, controller.createOrder);
router.get("/", auth, tenant, controller.getOrders);

module.exports = router;
