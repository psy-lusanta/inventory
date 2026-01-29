// routes/checkTableExists.js
const express = require("express");
const router = express.Router();
const pool = require("../../config/db.js");

// GET /api/inventory/table-exists/:device
router.get("/table-exists/:device", async (req, res) => {
  const { device } = req.params;

  try {
    const result = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'lx_inventory'
        AND table_name = $1
      );
      `,
      [device]
    );

    res.json({
      table: device,
      exists: result.rows[0].exists
    });

  } catch (err) {
    console.error("Error checking table:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
