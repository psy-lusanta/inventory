// routes/inventory/dropTable.js
const express = require("express");
const router = express.Router();
const { query } = require("../../config/db.js");
const { addNotification } = require("../../utils/addNotification.js");

router.delete("/:tableName", async (req, res) => {
  const { tableName } = req.params;
  const { displayName } = req.body || {};

  const display =
    displayName ||
    tableName.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  try {
    // Validate table name
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return res.status(400).json({ error: "Invalid table name" });
    }

    const submenuCheck = await query(
      `SELECT COUNT(*) AS count FROM inventory_meta.menu_hierarchy WHERE parent_table_name = $1`,
      [tableName]
    );

    const submenuCount = parseInt(submenuCheck.rows[0]?.count || 0);

    if (submenuCount > 0) {
      return res.status(400).json({
        error: `Cannot delete "${display}" — it has ${submenuCount} submenu(s). Delete all sub-tables first.`,
      });
    }

    const countResult = await query(
      `SELECT COUNT(*) AS count FROM inventory_items."${tableName}"`
    );

    const recordCount = parseInt(countResult.rows[0]?.count || 0);

    if (recordCount > 0) {
      return res.status(400).json({
        error: `Cannot delete table "${tableName}" — it contains ${recordCount} record${
          recordCount > 1 ? "s" : ""
        }. Delete all items first.`,
      });
    }

    await query(`DROP TABLE IF EXISTS inventory_items."${tableName}" CASCADE`);

    await query(
      `DELETE FROM inventory_meta.tablename_icon WHERE table_name = $1`,
      [tableName]
    );

    await query(
      `DELETE FROM inventory_meta.menu_hierarchy WHERE parent_table_name = $1`,
      [tableName]
    );

    await query(
      `DELETE FROM inventory_meta.menu_hierarchy WHERE submenu_path LIKE $1`,
      [`%/inventory/table/${tableName}`]
    );

    addNotification(`Deleted "${display}" Table by ${req.user.employee_name}`, "delete", "Trash2");

    res.json({
      message: `Table '${display}' and all its data deleted successfully`,
    });
  } catch (err) {
    console.error("Delete table error:", err);

    if (err.message.includes("does not exist")) {
      return res.status(404).json({ error: "Table not found" });
    }
    res.status(500).json({ error: "Failed to delete table" });
  }
});

module.exports = router;
