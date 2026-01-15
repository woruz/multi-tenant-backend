const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");
const controller = require("../controllers/stock.controller");

router.get("/low-stock", auth, tenant, controller.lowStock);

module.exports = router;
