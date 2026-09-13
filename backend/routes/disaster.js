const express = require("express");
const jwt = require("jsonwebtoken");
const pool = require("../db");
const { createNotification } = require("../utils/notifications");

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

// Report a disaster
router.post("/", authenticateToken, async (req, res) => {
  try {
    const {
      disaster_type,
      description,
      severity,
      location,
      latitude,
      longitude,
      image_url,
    } = req.body;

    if (!disaster_type || !description || !severity || !location) {
      return res.status(400).json({
        message:
          "Disaster type, description, severity and location are required",
      });
    }

    const allowedSeverity = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

    if (!allowedSeverity.includes(severity)) {
      return res.status(400).json({
        message: "Invalid severity level",
      });
    }

    const result = await pool.query(
      `INSERT INTO disasters
       (
         reported_by,
         disaster_type,
         description,
         severity,
         location,
         latitude,
         longitude,
         image_url
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user.id,
        disaster_type,
        description,
        severity,
        location,
        latitude || null,
        longitude || null,
        image_url || null,
      ]
    );

    const disaster = result.rows[0];

    // Notification for the person who reported the disaster
    await createNotification({
      user_id: req.user.id,
      title: "Disaster Report Submitted",
      message: `${disaster_type} disaster reported at ${location}. Severity: ${severity}.`,
      type: severity === "CRITICAL" ? "ALERT" : "INFO",
    });

    // Fetch all Admin users
    const adminResult = await pool.query(
      `SELECT id
       FROM users
       WHERE role = 'ADMIN'`
    );

    // Notification for all Admin users
    for (const admin of adminResult.rows) {
      await createNotification({
        user_id: admin.id,
        title:
          severity === "CRITICAL"
            ? "🚨 Critical Disaster Alert"
            : "New Disaster Reported",
        message: `${disaster_type} reported at ${location}. Severity: ${severity}.`,
        type: severity === "CRITICAL" ? "ALERT" : "INFO",
      });
    }

    res.status(201).json({
      message: "Disaster reported successfully",
      disaster,
    });
  } catch (error) {
    console.error("Report disaster error:", error);

    res.status(500).json({
      message: "Server error while reporting disaster",
    });
  }
});

// Get all disasters
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        d.*,
        u.name AS reporter_name,
        u.email AS reporter_email
       FROM disasters d
       LEFT JOIN users u
       ON d.reported_by = u.id
       ORDER BY d.created_at DESC`
    );

    res.json({
      message: "Disasters fetched successfully",
      disasters: result.rows,
    });
  } catch (error) {
    console.error("Fetch disasters error:", error);

    res.status(500).json({
      message: "Server error while fetching disasters",
    });
  }
});

// Update disaster status
router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const allowedStatuses = [
      "REPORTED",
      "VERIFIED",
      "ASSIGNED",
      "IN_PROGRESS",
      "RESOLVED",
      "REJECTED",
    ];

    if (!status) {
      return res.status(400).json({
        message: "Status is required",
      });
    }

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid disaster status",
      });
    }

    const disasterResult = await pool.query(
      "SELECT id FROM disasters WHERE id = $1",
      [id]
    );

    if (disasterResult.rows.length === 0) {
      return res.status(404).json({
        message: "Disaster not found",
      });
    }

    const result = await pool.query(
      `UPDATE disasters
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, id]
    );

    res.json({
      message: "Disaster status updated successfully",
      disaster: result.rows[0],
    });
  } catch (error) {
    console.error("Update disaster status error:", error);

    res.status(500).json({
      message: "Server error while updating disaster status",
    });
  }
});

module.exports = router;