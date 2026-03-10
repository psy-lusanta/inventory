const express = require("express");
const router = express.Router();
const { query } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const { addNotification } = require("../../utils/addNotification.js");

// POST /api/inventory/create-table/:tableName
router.post("/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    const { columns, displayName, icon, parentGroup } = req.body;

    if (!tableName) {
      return res.status(400).json({ error: "Missing table name" });
    }

    if (!columns || !Array.isArray(columns)) {
      return res.status(400).json({ error: "Missing or invalid columns" });
    }

    const sanitizedTable = sanitizeIdentifier(tableName);

    const fallbackDisplay = tableName
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    const tableDisplay = displayName || fallbackDisplay;

    // ────────────────────────────────────────────────
    // Convert frontend column name to snake_case DB name
    function toSnakeCase(str) {
      return str
        .trim()                            // remove extra spaces
        .replace(/\s+/g, "_")              // spaces → underscore
        .replace(/([a-z])([A-Z])/g, "$1_$2")  // camelCase → snake_case
        .replace(/_+/g, "_")               // multiple _ → single
        .replace(/[^a-z0-9_]/g, "")        // remove invalid characters
        .toLowerCase();
    }

    const colSql = columns
      .filter((col) => col.name?.trim())
      .map((col) => {
        const frontendName = col.name.trim();
        const dbName = toSnakeCase(frontendName);

        // Skip if conversion results in empty/invalid name
        if (!dbName) return null;

        // NO QUOTES around dbName — we want plain snake_case column names
        return `${dbName} ${col.type.toUpperCase()}`;
      })
      .filter(Boolean)   // remove null entries
      .join(",\n");

    const systemCols = `
      asset_tag TEXT PRIMARY KEY,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      created_by TEXT,
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      updated_by TEXT,
      status TEXT DEFAULT 'Available'
    `;

    const sql = `
      CREATE TABLE IF NOT EXISTS inventory_items.${sanitizedTable} (
        ${systemCols}${colSql ? ",\n" + colSql : ""}
      );
    `;

    // Debug log (remove later if you want)
    console.log("Creating table:", sanitizedTable);
    console.log("Generated column definitions:", colSql || "(no custom columns)");

    await query(sql);

    await query(
      `INSERT INTO inventory_meta.tablename_icon (table_name, display_name, icon, parent_group)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (table_name) 
        DO UPDATE SET 
          display_name = EXCLUDED.display_name, 
          icon = EXCLUDED.icon, 
          parent_group = EXCLUDED.parent_group;`,
      [sanitizedTable, displayName, req.body.icon || null, parentGroup || null],
    );

    addNotification(
      `New table "${tableDisplay}" created by ${req.user.employee_name || req.user.username}`,
      "create",
      "Plus",
    );

    res.json({
      message: `Table '${tableDisplay}' (${sanitizedTable}) created successfully.`,
    });
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ error: "Failed to create table: " + err.message });
  }
});

module.exports = router;