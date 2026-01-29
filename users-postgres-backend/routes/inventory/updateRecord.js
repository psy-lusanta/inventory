// routes/updateRecord.js
const express = require("express");
const router = express.Router();

const { query, pool } = require("../../config/db.js");
const DEVICE_CODES = require("../../config/deviceCodes.js");
const { getFullTableName } = require("../../utils/tableHelper.js");
const { addNotification } = require("../../utils/addNotification.js");

// PUT /api/inventory/:device/:asset_tag
router.put("/:device/:asset_tag", async (req, res) => {
  const { device, asset_tag: oldAssetTag } = req.params;
  const user = req.user.employee_name;
  const { displayName } = req.body;
  const updates = {
    ...req.body,
    updated_at: new Date(),
    updated_by: user,
  };
  const tableName = getFullTableName(device);

  try {
    const fields = Object.keys(updates)
      .map((key, i) => `"${key}" = $${i + 1}`)
      .join(", ");

    const values = Object.values(updates);

    const sql = `
      UPDATE ${tableName}
      SET ${fields}
      WHERE asset_tag = $${values.length + 1}
      RETURNING *;
    `;

    const result = await pool.query(sql, [...values, oldAssetTag]);

    if (!result.rowCount) {
      return res.status(404).json({ error: "Record not found" });
    }

    const display =
      displayName ||
      device.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

    addNotification(
      `Updated record in "${display}" by ${req.user.employee_name}`,
      "update",
      "Edit3",
    );
    res.json({
      message: "Record updated successfully",
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Asset tag already exists. Please use a unique asset tag.",
      });
    }
    console.error("Unexpected error during update:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
