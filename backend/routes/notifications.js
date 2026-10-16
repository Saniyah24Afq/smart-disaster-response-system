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

// Create notification
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { user_id, title, message, type } = req.body;

    if (!user_id || !title || !message) {
      return res.status(400).json({
        message: "User ID, title and message are required",
      });
    }

    const result = await pool.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        user_id,
        title,
        message,
        type || "INFO",
      ]
    );

    res.status(201).json({
      message: "Notification created successfully",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Create notification error:", error);

    res.status(500).json({
      message: "Server error while creating notification",
    });
  }
});

// Get notifications for logged-in user
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "Notifications fetched successfully",
      notifications: result.rows,
    });
  } catch (error) {
    console.error("Fetch notifications error:", error);

    res.status(500).json({
      message: "Server error while fetching notifications",
    });
  }
});

// Mark notification as read
router.patch("/:id/read", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE notifications
       SET is_read = TRUE
       WHERE id = $1
       AND user_id = $2
       RETURNING *`,
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    res.json({
      message: "Notification marked as read",
      notification: result.rows[0],
    });
  } catch (error) {
    console.error("Mark notification read error:", error);

    res.status(500).json({
      message: "Server error while updating notification",
    });
  }
});

module.exports = router;