const pool = require("../db");

const createNotification = async ({
  user_id,
  title,
  message,
  type = "INFO",
}) => {
  try {
    const result = await pool.query(
      `INSERT INTO notifications
       (user_id, title, message, type)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [user_id, title, message, type]
    );

    return result.rows[0];
  } catch (error) {
    console.error("Automatic notification error:", error);
    return null;
  }
};

module.exports = {
  createNotification,
};