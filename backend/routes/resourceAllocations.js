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

// Allocate resource to a disaster
router.post("/", authenticateToken, async (req, res) => {
  const client = await pool.connect();

  try {
    const {
      disaster_id,
      resource_id,
      quantity,
    } = req.body;

    // Validate input
    if (!disaster_id || !resource_id || quantity === undefined) {
      return res.status(400).json({
        message: "Disaster ID, resource ID and quantity are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than 0",
      });
    }

    await client.query("BEGIN");

    // Check disaster
    const disasterResult = await client.query(
      "SELECT id, status FROM disasters WHERE id = $1",
      [disaster_id]
    );

    if (disasterResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Disaster not found",
      });
    }

    // Check resource and lock row
    const resourceResult = await client.query(
      `SELECT id, name, quantity, unit, location
       FROM resources
       WHERE id = $1
       FOR UPDATE`,
      [resource_id]
    );

    if (resourceResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Resource not found",
      });
    }

    const resource = resourceResult.rows[0];

    // Check available quantity
    if (resource.quantity < quantity) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient resource quantity",
        available_quantity: resource.quantity,
        requested_quantity: quantity,
      });
    }

    // Create allocation
    const allocationResult = await client.query(
      `INSERT INTO resource_allocations
       (disaster_id, resource_id, quantity, allocated_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [disaster_id, resource_id, quantity, req.user.id]
    );

    // Reduce available resource quantity
    await client.query(
      `UPDATE resources
       SET quantity = quantity - $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [quantity, resource_id]
    );

    await client.query("COMMIT");

    res.status(201).json({
      message: "Resource allocated successfully",
      allocation: allocationResult.rows[0],
      remaining_quantity: resource.quantity - quantity,
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Resource allocation error:", error);

    res.status(500).json({
      message: "Server error while allocating resource",
    });
  } finally {
    client.release();
  }
});

// Get all resource allocations
router.get("/", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
        ra.id,
        ra.disaster_id,
        d.disaster_type,
        d.severity,
        d.location,
        ra.resource_id,
        r.name AS resource_name,
        r.category,
        ra.quantity,
        r.unit,
        ra.allocated_by,
        ra.allocated_at
       FROM resource_allocations ra
       JOIN disasters d ON ra.disaster_id = d.id
       JOIN resources r ON ra.resource_id = r.id
       ORDER BY ra.allocated_at DESC`
    );

    res.json({
      message: "Resource allocations fetched successfully",
      allocations: result.rows,
    });
  } catch (error) {
    console.error("Fetch resource allocations error:", error);

    res.status(500).json({
      message: "Server error while fetching resource allocations",
    });
  }
});

module.exports = router;