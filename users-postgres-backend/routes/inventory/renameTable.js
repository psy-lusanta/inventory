// routes/renameTable.js
const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const { addNotification } = require("../../utils/addNotification.js");

// POST /api/inventory/rename-table
router.post("/", async (req, res) => {
  const { old_name, new_name, oldDisplayName, newDisplayName } = req.body;

  try {
    if (!old_name || !new_name) {
      return res.status(400).json({ error: "old_name and new_name required" });
    }

    const validName = /^[a-zA-Z0-9_]+$/;
    if (!validName.test(old_name) || !validName.test(new_name)) {
      return res.status(400).json({ error: "Invalid table name format" });
    }

    const oldExists = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'inventory_items'
        AND table_name = $1
      );
    `,
      [old_name]
    );

    if (!oldExists.rows[0].exists) {
      return res.status(404).json({ error: "Old table does not exist" });
    }

    // Check new table does NOT exist
    const newExists = await pool.query(
      `
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'inventory_items'
        AND table_name = $1
      );
    `,
      [new_name]
    );

    if (newExists.rows[0].exists) {
      return res.status(400).json({ error: "New table name already exists" });
    }

    await pool.query(`
      SELECT pg_terminate_backend(pg_stat_activity.pid)
      FROM pg_stat_activity
      WHERE pg_stat_activity.datname = current_database()
      AND pid <> pg_backend_pid()
      AND query ILIKE '%${old_name}%';
    `);

    await pool.query(
      `ALTER TABLE inventory_items."${old_name}" RENAME TO "${new_name}"`
    );

    await query(
      `UPDATE inventory_meta.tablename_icon 
        SET table_name = $1, display_name = $2 
        WHERE table_name = $3`,
      [
        new_name,
        newDisplayName ||
          new_name.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()),
        old_name,
      ]
    );

    addNotification(
      `Renamed table "${oldDisplayName || old_name}" to "${
        newDisplayName || new_name
      }" by ${req.user.employee_name}`, "update", "Edit3"
    );
    res.json({
      message: `Table renamed successfully`,
      old: oldDisplayName,
      new: newDisplayName,
    });
  } catch (err) {
    console.error("Rename table error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
