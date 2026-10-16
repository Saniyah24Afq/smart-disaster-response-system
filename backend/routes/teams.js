const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");

const router = express.Router();

// JWT Authentication
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access token required",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      message: "Invalid or expired token",
    });
  }
};

// Add a new response team
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      team_name,
      type,
      leader,
      phone,
      member_count,
      status,
      location,
    } = req.body;

    if (!team_name || !type) {
      return res.status(400).json({
        message: "Team name and type are required",
      });
    }

    const allowedStatuses = ["AVAILABLE", "BUSY", "OFFLINE"];
    const teamStatus = status || "AVAILABLE";

    if (!allowedStatuses.includes(teamStatus)) {
      return res.status(400).json({
        message: "Invalid team status",
      });
    }

    if (member_count !== undefined && member_count < 0) {
      return res.status(400).json({
        message: "Member count cannot be negative",
      });
    }

    const result = await pool.query(
      `INSERT INTO response_teams
       (team_name, type, leader, phone, member_count, status, location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        team_name,
        type,
        leader || null,
        phone || null,
        member_count || 0,
        teamStatus,
        location || null,
      ]
    );

    res.status(201).json({
      message: "Response team added successfully",
      team: result.rows[0],
    });
  } catch (error) {
    console.error("Add response team error:", error);

    res.status(500).json({
      message: "Server error while adding response team",
    });
  }
});

// Get all response teams
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM response_teams
       ORDER BY created_at DESC`
    );

    res.json({
      message: "Response teams fetched successfully",
      teams: result.rows,
    });
  } catch (error) {
    console.error("Fetch response teams error:", error);

    res.status(500).json({
      message: "Server error while fetching response teams",
    });
  }
});

module.exports = router;