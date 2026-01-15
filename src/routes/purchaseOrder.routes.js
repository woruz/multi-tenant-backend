const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");
const controller = require("../controllers/purchaseOrder.controller");

router.get("/", auth, tenant, controller.getPurchaseOrders);
router.post("/receive", auth, tenant, controller.receivePO);       

module.exports = router;
