const express = require("express");
const path = require("path");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const http = require("http");
const socketIo = require("socket.io");
require("dotenv").config();

// Import models with associations
const models = require("./models");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const postRoutes = require("./routes/posts");
const jobRoutes = require("./routes/jobs");
const resumeRoutes = require("./routes/resumes");
const uploadRoutes = require("./routes/upload");
const notificationRoutes = require("./routes/notifications");
const { authenticateToken } = require("./middleware/auth");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
const messageRoutes = require("./routes/messages")(io); // Comment out for now

// Helper to decode token (adjust as per your auth)
function getUserIdFromToken(token) {
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return payload.id; // or payload.userId
  } catch {
    return "Monish No Token Found";
  }
}
// Add this after your existing socket setup
io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  const userId = getUserIdFromToken(token);
  console.clear();
  console.log(userId);

  console.log("inside monish");

  if (!userId) {
    console.log("No userId, disconnecting", socket.id);
    socket.disconnect();
    return;
  }

  // Add user info to socket for easy access
  socket.userId = userId;

  // Join user-specific room (all devices/tabs for user)
  socket.join(`user:${userId}`);
  console.log(`User ${userId} joined their own room (socket: ${socket.id})`);

  // Notify others (except this socket) that this user is online
  socket.broadcast.emit("userOnline", userId);
  console.log(`Broadcasted userOnline for user ${userId}`);

  // When user joins a conversation
  socket.on("joinChat", (conversationId) => {
    socket.join(conversationId);
    console.log(
      `Socket ${socket.id} (User ${userId}) joined chat room ${conversationId}`
    );
  });

  // When a message is sent through socket (for real-time chat)
  socket.on("sendMessage", (messageData) => {
    console.log(`Received sendMessage from user ${userId}:`);
    // Broadcast to everyone in the conversation room except sender
    socket.to(messageData.conversationId).emit("newMessage", messageData);
    console.log(
      `Emitted newMessage to chat room ${messageData.conversationId}:`
    );
  });

  // Message read receipts
  socket.on("messageRead", ({ conversationId }) => {
    console.log(
      `messageRead: User ${userId} read conversation ${conversationId}`
    );
    socket.to(conversationId).emit("messageRead", { conversationId, userId });
  });

  // Typing indicators
  socket.on("typing", ({ chatId }) => {
    console.log(`User ${userId} is typing in chat ${chatId}`);
    socket.to(chatId).emit("userTyping", {
      userId,
      chatId,
    });
  });

  socket.on("stopTyping", ({ chatId }) => {
    console.log(`User ${userId} stopped typing in chat ${chatId}`);
    socket.to(chatId).emit("userStoppedTyping", {
      userId,
      chatId,
    });
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `User disconnected: socket ${socket.id} (User ${userId}), reason: ${reason}`
    );
    // Optionally notify others user went offline
    socket.broadcast.emit("userOffline", userId);
  });
});

// Security middleware
app.use(helmet());
app.use(
  cors({
    origin: [
      "http://localhost:3000", // React dev server
      "http://127.0.0.1:3000",
      "http://localhost:3001", // Alternative port
    ],
    credentials: true,
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS", "HEAD"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "Cache-Control",
      "Pragma",
    ],
    exposedHeaders: ["Content-Length", "Content-Type"],
    maxAge: 86400, // 24 hours
  })
);

app.options("*", cors());

// Rate limiting (commented out for development)
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static file serving with proper headers
app.use("/uploads", (req, res, next) => {
  // Set CORS headers for static files
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header("Cross-Origin-Resource-Policy", "cross-origin");

  // Set caching headers
  res.header("Cache-Control", "public, max-age=31536000"); // 1 year

  console.log(`Static file request: ${req.method} ${req.path}`);
  next();
});

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/api/messages", messageRoutes); // Comment out for now
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// Job applications route
const jobApplicationRoutes = require("./routes/job-applications");
const { clearScreenDown } = require("readline");
app.use("/api/job-applications", jobApplicationRoutes);

// Static file routes
app.use(
  "/uploads/messages",
  express.static(path.join(__dirname, "uploads/messages"))
);

app.use(
  "/uploads/resumes",
  express.static(path.join(__dirname, "uploads/resumes"))
);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

models.sequelize
  .authenticate()
  .then(() => {
    // console.clear();
    console.log("Database connected successfully");

    // DON'T USE SYNC - Use migrations instead
    // return models.sequelize.sync({ force: false });

    // Just start the server after successful connection
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to database:", err);
    process.exit(1);
  });

module.exports = { app, io };
