const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const tenant = require("../middleware/tenant");
const controller = require("../controllers/dashboard.controller");

router.get("/", auth, tenant, controller.dashboard);  

module.exports = router;
