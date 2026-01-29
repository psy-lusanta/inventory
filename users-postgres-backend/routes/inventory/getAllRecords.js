const express = require("express");
const router = express.Router();

const { query, pool } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const DEVICE_CODES = require("../../config/deviceCodes");

// GET all records from a device table
// GET /api/inventory/:device
router.get("/:device", async (req, res) => {
  try {
    const { device } = req.params;

    // Validate device name
    const tableName = sanitizeIdentifier(device);
    if (!DEVICE_CODES[device]) {
      return res.status(400).json({ error: "Invalid device type" });
    }

    const sql = `
      SELECT *
      FROM lx_inventory.${tableName}
      ORDER BY created_at DESC;
    `;

    const result = await query(sql);

    return res.json(result.rows);

  } catch (err) {
    console.error("Get all records error:", err);
    return res.status(500).json({ error: "Failed to fetch records" });
  }
});

module.exports = router;
