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

// Dashboard statistics
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM disasters) AS total_disasters,

        (SELECT COUNT(*)
         FROM disasters
         WHERE status NOT IN ('RESOLVED', 'REJECTED')
        ) AS active_emergencies,

        (SELECT COUNT(*)
         FROM disasters
         WHERE status = 'RESOLVED'
        ) AS resolved_disasters,

        (SELECT COUNT(*)
         FROM disasters
         WHERE severity = 'CRITICAL'
         AND status NOT IN ('RESOLVED', 'REJECTED')
        ) AS critical_incidents,

        (SELECT COUNT(*) FROM resources) AS total_resources,

        (SELECT COALESCE(SUM(quantity), 0)
         FROM resources
        ) AS available_resource_quantity,

        (SELECT COUNT(*)
         FROM response_teams
         WHERE status = 'AVAILABLE'
        ) AS available_teams,

        (SELECT COUNT(*)
         FROM response_teams
         WHERE status = 'BUSY'
        ) AS busy_teams,

        (SELECT COUNT(*)
         FROM response_teams
         WHERE status = 'OFFLINE'
        ) AS offline_teams
    `);

    const stats = result.rows[0];

    res.json({
      message: "Dashboard statistics fetched successfully",
      stats: {
        total_disasters: Number(stats.total_disasters),
        active_emergencies: Number(stats.active_emergencies),
        resolved_disasters: Number(stats.resolved_disasters),
        critical_incidents: Number(stats.critical_incidents),
        total_resources: Number(stats.total_resources),
        available_resource_quantity: Number(
          stats.available_resource_quantity
        ),
        available_teams: Number(stats.available_teams),
        busy_teams: Number(stats.busy_teams),
        offline_teams: Number(stats.offline_teams),
      },
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);

    res.status(500).json({
      message: "Server error while fetching dashboard statistics",
    });
  }
});

module.exports = router;