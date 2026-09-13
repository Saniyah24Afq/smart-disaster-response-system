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

// ======================================================
// ASSIGN A RESPONSE TEAM TO A DISASTER
// ======================================================

router.post("/", authenticateToken, async (req, res) => {
  try {
    const { disaster_id, team_id } = req.body;

    if (!disaster_id || !team_id) {
      return res.status(400).json({
        message: "Disaster ID and team ID are required",
      });
    }

    // Check if disaster exists
    const disasterResult = await pool.query(
      `SELECT id, disaster_type, severity, location, status
       FROM disasters
       WHERE id = $1`,
      [disaster_id]
    );

    if (disasterResult.rows.length === 0) {
      return res.status(404).json({
        message: "Disaster not found",
      });
    }

    const disaster = disasterResult.rows[0];

    // Check if response team exists
    const teamResult = await pool.query(
      `SELECT id, team_name, status, user_id
       FROM response_teams
       WHERE id = $1`,
      [team_id]
    );

    if (teamResult.rows.length === 0) {
      return res.status(404).json({
        message: "Response team not found",
      });
    }

    const team = teamResult.rows[0];

    // Check team availability
    if (team.status !== "AVAILABLE") {
      return res.status(400).json({
        message: "Response team is not available",
      });
    }

    // Create assignment
    const result = await pool.query(
      `INSERT INTO incident_assignments
       (disaster_id, team_id, assigned_by, status)
       VALUES ($1, $2, $3, 'ASSIGNED')
       RETURNING *`,
      [disaster_id, team_id, req.user.id]
    );

    // Update disaster status
    await pool.query(
      `UPDATE disasters
       SET status = 'ASSIGNED',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [disaster_id]
    );

    // Update team status
    await pool.query(
      `UPDATE response_teams
       SET status = 'BUSY'
       WHERE id = $1`,
      [team_id]
    );

    // ==================================================
    // AUTOMATIC NOTIFICATION
    // ==================================================

    if (team.user_id) {
      await createNotification({
        user_id: team.user_id,
        title: "🚨 New Disaster Assignment",
        message: `${team.team_name} has been assigned to a ${disaster.severity} ${disaster.disaster_type} incident at ${disaster.location}.`,
        type: disaster.severity === "CRITICAL" ? "ALERT" : "INFO",
      });
    }

    // Notification for the Admin who assigned the team
    await createNotification({
      user_id: req.user.id,
      title: "Response Team Assigned",
      message: `${team.team_name} has been successfully assigned to the ${disaster.disaster_type} incident at ${disaster.location}.`,
      type: "INFO",
    });

    res.status(201).json({
      message: "Response team assigned successfully",
      assignment: result.rows[0],
    });
  } catch (error) {
    console.error("Assign response team error:", error);

    res.status(500).json({
      message: "Server error while assigning response team",
    });
  }
});

// ======================================================
// GET ALL ASSIGNMENTS
// ======================================================

router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ia.id,
        ia.disaster_id,
        d.disaster_type,
        d.severity,
        d.location,
        ia.team_id,
        rt.team_name,
        rt.type AS team_type,
        ia.status,
        ia.assigned_by,
        ia.assigned_at
       FROM incident_assignments ia
       JOIN disasters d ON ia.disaster_id = d.id
       JOIN response_teams rt ON ia.team_id = rt.id
       ORDER BY ia.assigned_at DESC`
    );

    res.json({
      message: "Assignments fetched successfully",
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Fetch assignments error:", error);

    res.status(500).json({
      message: "Server error while fetching assignments",
    });
  }
});

// ======================================================
// GET ASSIGNMENTS FOR LOGGED-IN RESPONSE TEAM
// ======================================================

router.get("/my", authenticateToken, async (req, res) => {
  try {
    // Only response team users can access this endpoint
    if (req.user.role !== "RESPONSE_TEAM") {
      return res.status(403).json({
        message: "Only response team users can access their assignments",
      });
    }

    const result = await pool.query(
      `SELECT
        ia.id,
        ia.disaster_id,
        d.disaster_type,
        d.description,
        d.severity,
        d.location,
        d.latitude,
        d.longitude,
        d.image_url,
        d.status AS disaster_status,
        ia.team_id,
        rt.team_name,
        rt.type AS team_type,
        rt.leader,
        rt.phone AS team_phone,
        ia.status AS assignment_status,
        ia.assigned_by,
        ia.assigned_at
       FROM incident_assignments ia
       JOIN disasters d ON ia.disaster_id = d.id
       JOIN response_teams rt ON ia.team_id = rt.id
       WHERE rt.user_id = $1
       ORDER BY ia.assigned_at DESC`,
      [req.user.id]
    );

    res.json({
      message: "My assignments fetched successfully",
      assignments: result.rows,
    });
  } catch (error) {
    console.error("Fetch my assignments error:", error);

    res.status(500).json({
      message: "Server error while fetching my assignments",
    });
  }
});

// ======================================================
// UPDATE ASSIGNMENT STATUS
// ASSIGNED → IN_PROGRESS → RESOLVED
// ======================================================

router.patch("/:id/status", authenticateToken, async (req, res) => {
  try {
    const assignmentId = req.params.id;
    const { status } = req.body;

    // Only response team users can update status
    if (req.user.role !== "RESPONSE_TEAM") {
      return res.status(403).json({
        message: "Only response team users can update assignment status",
      });
    }

    // Allowed statuses
    const allowedStatuses = ["IN_PROGRESS", "RESOLVED"];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid status. Use IN_PROGRESS or RESOLVED",
      });
    }

    // Find assignment belonging to logged-in response team
    const assignmentResult = await pool.query(
      `SELECT
        ia.id,
        ia.disaster_id,
        ia.team_id,
        ia.status,
        rt.user_id
       FROM incident_assignments ia
       JOIN response_teams rt ON ia.team_id = rt.id
       WHERE ia.id = $1
         AND rt.user_id = $2`,
      [assignmentId, req.user.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        message: "Assignment not found for this response team",
      });
    }

    const assignment = assignmentResult.rows[0];

    // Prevent invalid status progression
    if (
      status === "IN_PROGRESS" &&
      assignment.status !== "ASSIGNED"
    ) {
      return res.status(400).json({
        message: "Only ASSIGNED incidents can be started",
      });
    }

    if (
      status === "RESOLVED" &&
      assignment.status !== "IN_PROGRESS"
    ) {
      return res.status(400).json({
        message: "Only IN_PROGRESS incidents can be resolved",
      });
    }

    // Update assignment status
    const updatedAssignment = await pool.query(
      `UPDATE incident_assignments
       SET status = $1
       WHERE id = $2
       RETURNING *`,
      [status, assignmentId]
    );

    // Update disaster status
    await pool.query(
      `UPDATE disasters
       SET status = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, assignment.disaster_id]
    );

    // When resolved, make team available again
    if (status === "RESOLVED") {
      await pool.query(
        `UPDATE response_teams
         SET status = 'AVAILABLE'
         WHERE id = $1`,
        [assignment.team_id]
      );
    }

    res.json({
      message: `Assignment status updated to ${status}`,
      assignment: updatedAssignment.rows[0],
    });
  } catch (error) {
    console.error("Update assignment status error:", error);

    res.status(500).json({
      message: "Server error while updating assignment status",
    });
  }
});

module.exports = router;