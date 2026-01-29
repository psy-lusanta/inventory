const express = require("express");
const router = express.Router();

const { query, pool } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const DEVICE_CODES = require("../../config/deviceCodes");

// GET /api/inventory/:device/:asset_tag
router.get("/:device/:asset_tag", async (req, res) => {
  try {
    const { device, asset_tag } = req.params;

    // Validate device type
    if (!DEVICE_CODES[device]) {
      return res.status(400).json({ error: "Invalid device type" });
    }

    // Sanitize table name only (NOT asset_tag)
    const tableName = sanitizeIdentifier(device);

    const sql = `
      SELECT *
      FROM lx_inventory.${tableName}
      WHERE asset_tag = $1
      LIMIT 1;
    `;

    const result = await query(sql, [asset_tag]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Record not found" });
    }

    const row = result.rows[0];

    return res.json({
      ...row,
      created_at: formatDateTime(row.created_at),
      updated_at: formatDateTime(row.updated_at),
    });

  } catch (err) {
    console.error("Get one record error:", err);
    return res.status(500).json({ error: "Failed to fetch record" });
  }
});

module.exports = router;
