const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const { getFullTableName } = require("../../utils/tableHelper.js");
const { addNotification } = require("../../utils/addNotification.js");

// DELETE /api/inventory/:device/:asset_tag
router.delete("/:device/:asset_tag", async (req, res) => {
  const { device, asset_tag } = req.params;
  const tableName = getFullTableName(device);
  const displayName = req.body;
  const display =
    displayName ||
    device.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

  try {
    const result = await pool.query(
      `DELETE FROM ${tableName} WHERE asset_tag = $1 RETURNING *;`,
      [asset_tag]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    addNotification(
      `Deleted "${asset_tag}" from "${display}" Table by ${req.user.employee_name}`, "delete", "Trash2"
    );
    res.json({
      message: "Record deleted successfully",
      deleted: result.rows[0],
    });
  } catch (err) {
    console.error("Error deleting record:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
