const express = require("express");
const path = require("path");
// const express = require("express");
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
const messageRoutes = require("./routes/messages");
const uploadRoutes = require("./routes/upload");
const notificationRoutes = require("./routes/notifications");
const { authenticateToken } = require("./middleware/auth");
// const stockPhotoRoutes = require("./routes/stock-photos");

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Rest of your server.js code remains the same...
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

// Rate limiting
// const limiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100,
//   message: "Too many requests from this IP, please try again later.",
// });
// app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Static files
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
app.use("/api/messages", messageRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/notifications", notificationRoutes);

// Add this with your other routes
const jobApplicationRoutes = require("./routes/job-applications");
app.use("/api/job-applications", jobApplicationRoutes);

// Serve resume files statically
app.use(
  "/uploads/resumes",
  express.static(path.join(__dirname, "uploads/resumes"))
);

// Add this with your other routes
// app.use("/api/stock-photos", stockPhotoRoutes);

// Serve stock photos statically
// app.use(
//   "/uploads/stock-photos",
//   express.static(path.join(__dirname, "uploads/stock-photos"))
// );

// Socket.io configuration (rest remains the same)...

// Database connection and server start
const PORT = process.env.PORT || 5000;

models.sequelize
  .authenticate()
  .then(() => {
    console.clear();
    console.log("Database connected successfully");
    return models.sequelize.sync({ force: false });
  })
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Unable to connect to database:", err);
    process.exit(1);
  });

module.exports = { app, io };
