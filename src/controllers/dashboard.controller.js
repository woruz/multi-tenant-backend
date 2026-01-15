const asyncHandler = require("../utils/asyncHandler");
const { getDashboard } = require("../services/dashboard.service");

exports.dashboard = asyncHandler(async (req, res) => {
  const tenantId = req.tenantId;
  const data = await getDashboard(tenantId);  
  res.json(data);
});
