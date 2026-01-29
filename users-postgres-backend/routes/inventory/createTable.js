const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
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

    const colSql = columns
      .filter((col) => col.name && col.type)
      .map((col) => `${sanitizeIdentifier(col.name)} ${col.type}`)
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

    await query(sql);

    await query(
      `INSERT INTO inventory_meta.tablename_icon (table_name, display_name, icon, parent_group)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (table_name) 
        DO UPDATE SET 
          display_name = EXCLUDED.display_name, 
          icon = EXCLUDED.icon, 
          parent_group = EXCLUDED.parent_group;`,
      [sanitizedTable, displayName, req.body.icon || "NotebookText", parentGroup || null]
    );

    addNotification(`New table "${displayName}" created by ${req.user.employee_name}`, "create", "Plus");
    res.json({
      message: `Table '${sanitizedTable}' created successfully.`,
    });
  } catch (err) {
    console.error("Create table error:", err);
    res.status(500).json({ error: "Failed to create table" });
  }
});

module.exports = router;
