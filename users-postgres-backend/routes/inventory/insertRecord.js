const express = require("express");
const router = express.Router();
const { query } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const { addNotification } = require("../../utils/addNotification.js");

// POST /api/inventory/:tableName
router.post("/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const user = req.user.employee_name || req.user.username;
    const { displayName, ...recordData } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: "Missing table name" });
    }

    const sanitizedTable = sanitizeIdentifier(tableName);

    const fallbackDisplay = tableName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const tableDisplay = displayName || fallbackDisplay;

    // Add system fields
    const data = {
      ...recordData,
      created_at: new Date(),
      created_by: user,
      updated_at: new Date(),
      updated_by: user,
    };

    const fields = Object.keys(data).map(sanitizeIdentifier);
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(", ");

    const sql = `
      INSERT INTO inventory_items."${sanitizedTable}"
      (${fields.join(", ")})
      VALUES (${placeholders})
      RETURNING *;
    `;

    const result = await query(sql, values);

    const itemIdentifier =
      recordData.asset_tag || recordData.item_name || "item";
      
    addNotification(
      `Added "${itemIdentifier}" to "${tableDisplay}" by ${user}`, "success", "Plus"
    );

    res.json({
      message: "Record inserted successfully",
      data: result.rows[0],
    });
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({
        error: "Asset tag already exists. Please use a unique asset tag.",
      });
    }
    console.error("Unexpected error during insert:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
