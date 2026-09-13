const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// ============================================
// JWT AUTHENTICATION
// ============================================

const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("RESOURCE JWT ERROR: Access token missing");

      return res.status(401).json({
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Resource JWT verified:", decoded);

    req.user = decoded;
    next();
  } catch (error) {
    console.error("RESOURCE JWT ERROR:", error.message);

    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// ============================================
// ADD NEW RESOURCE
// ============================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category,
      quantity,
      unit,
      location,
    } = req.body;

    console.log("Add resource request:", req.body);

    if (!name || !category || quantity === undefined || !unit || !location) {
      return res.status(400).json({
        message: "Name, category, quantity, unit and location are required",
      });
    }

    if (quantity < 0) {
      return res.status(400).json({
        message: "Quantity cannot be negative",
      });
    }

    const result = await pool.query(
      `INSERT INTO resources
       (name, category, quantity, unit, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, category, quantity, unit, location]
    );

    res.status(201).json({
      message: "Resource added successfully",
      resource: result.rows[0],
    });
  } catch (error) {
    console.error("Add resource error:", error);

    res.status(500).json({
      message: "Server error while adding resource",
    });
  }
});

// ============================================
// GET ALL RESOURCES
// ============================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM resources
       ORDER BY created_at DESC`
    );

    res.json({
      message: "Resources fetched successfully",
      resources: result.rows,
    });
  } catch (error) {
    console.error("Fetch resources error:", error);

    res.status(500).json({
      message: "Server error while fetching resources",
    });
  }
});

module.exports = router;