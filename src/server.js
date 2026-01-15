require("dotenv").config();
require("./models");

const app = require("./app");
const connectDB = require("./config/db");
require("./config"); // initializes Redis

const http = require("http");
const { Server } = require("socket.io");

const PORT = process.env.PORT || 5000;

(async () => {
  await connectDB();

  // Create HTTP server from Express app
  const server = http.createServer(app);

  // Initialize Socket.io
  const io = new Server(server, {
    cors: { origin: "*" } // allow all for dev; in prod restrict to frontend URL
  });

  // Attach io instance to app for access in controllers/services
  app.set("io", io);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
})();
