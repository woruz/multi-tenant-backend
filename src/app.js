const express = require("express");
const cors = require("cors");
const errorMiddleware = require("./middleware/errorMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/orders", require("./routes/order.routes"));
app.use("/api/purchaseOrders", require("./routes/purchaseOrder.routes"));
app.use("/api/stock", require("./routes/stock.routes"));
app.use("/api/dashboard", require("./routes/dashboard.routes"));   

app.use(errorMiddleware);

module.exports = app;
