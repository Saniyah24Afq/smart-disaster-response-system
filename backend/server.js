const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// Routes
const authRoutes = require("./routes/auth");
const disasterRoutes = require("./routes/disaster");
const resourceRoutes = require("./routes/resources");
const teamRoutes = require("./routes/teams");
const assignmentRoutes = require("./routes/assignments");
const resourceAllocationRoutes = require("./routes/resourceAllocations");
const notificationRoutes = require("./routes/notifications");
const dashboardRoutes = require("./routes/dashboard");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/disasters", disasterRoutes);
app.use("/api/resources", resourceRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/allocations", resourceAllocationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard", dashboardRoutes);

// Home route
app.get("/", (req, res) => {
  res.json({
    message: "RESQ Backend is running successfully 🚨",
  });
});

// Health check
app.get("/health", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      status: "healthy",
      database: "connected",
      time: result.rows[0].now,
    });
  } catch (error) {
    console.error("Database connection error:", error);

    res.status(500).json({
      status: "unhealthy",
      database: "disconnected",
    });
  }
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`RESQ Backend running on http://localhost:${PORT}`);
});