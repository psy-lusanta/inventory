// routes/listTables.js
const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");

// GET /api/inventory/tables
router.get("/tables", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name, display_name, parent_group AS icon FROM inventory_meta.tablename_icon
      ORDER BY table_name ASC;
    `);

    res.json({
      tables: result.rows,
    });
  } catch (err) {
    console.error("Error listing tables:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/inventory/tables/:tableName
router.get("/tables/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;

    // rows result
    const result = await pool.query(
      `SELECT * FROM inventory_items."${tableName}"`
    );
    const rows = result.rows || [];

    const columns = result.fields
      ? result.fields.map((f) => ({ name: f.name }))
      : rows.length
      ? Object.keys(rows[0]).map((n) => ({ name: n }))
      : [];

    // fetch icon from metadata table
    const meta = await pool.query(
      `SELECT icon FROM inventory_meta.tablename_icon WHERE table_name = $1`,
      [tableName]
    );
    const icon = meta.rows[0]?.icon || null;

    return res.json({ columns, rows, icon });
  } catch (err) {
    console.error("Error loading table:", err.message);
    return res
      .status(404)
      .json({ columns: [], rows: [], icon: null, message: "Table not found" });
  }
});

module.exports = router;
