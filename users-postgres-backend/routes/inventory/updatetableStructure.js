// routes/inventory/updateTableStructure.js
const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const { addNotification } = require("../../utils/addNotification.js");

router.put("/:tableName", async (req, res) => {
  const { tableName } = req.params;
  const { displayName, icon, columns } = req.body;

  if (!Array.isArray(columns)) {
    return res.status(400).json({ error: "Columns must be an array" });
  }

  try {
    const sanitizedTable = sanitizeIdentifier(tableName);

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `INSERT INTO inventory_meta.tablename_icon (table_name, display_name, icon)
         VALUES ($1, $2, $3)
         ON CONFLICT (table_name) DO UPDATE
         SET display_name = EXCLUDED.display_name,
             icon = EXCLUDED.icon`,
        [
          sanitizedTable,
          displayName?.trim() || sanitizedTable,
          icon || "NotebookText",
        ]
      );

      const currentRes = await client.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = 'inventory_items'
           AND table_name = $1
           AND column_name NOT IN ('id', 'asset_tag', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status')`,
        [sanitizedTable]
      );

      const currentCols = currentRes.rows.map((row) => ({
        name: row.column_name,
        type: row.data_type.toUpperCase(),
      }));

      const desiredCols = columns
        .filter((col) => col.name?.trim())
        .map((col) => ({
          oldName: null, 
          name: sanitizeIdentifier(col.name.trim()),
          type: (col.type || "TEXT").toUpperCase(),
        }));

      const minLength = Math.min(currentCols.length, desiredCols.length);
      for (let i = 0; i < minLength; i++) {
        if (currentCols[i].name !== desiredCols[i].name) {
          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
             RENAME COLUMN "${currentCols[i].name}" TO "${desiredCols[i].name}"`
          );
        }

        if (currentCols[i].type !== desiredCols[i].type) {
          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
             ALTER COLUMN "${desiredCols[i].name}" TYPE ${desiredCols[i].type} USING "${desiredCols[i].name}"::${desiredCols[i].type}`
          );
        }
      }

      for (let i = currentCols.length; i < desiredCols.length; i++) {
        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
           ADD COLUMN IF NOT EXISTS "${desiredCols[i].name}" ${desiredCols[i].type}`
        );
      }

      for (let i = desiredCols.length; i < currentCols.length; i++) {
        const colToDrop = currentCols[i];

        const dataCheck = await client.query(
          `SELECT EXISTS (
            SELECT 1 FROM inventory_items."${sanitizedTable}"
            WHERE "${colToDrop.name}" IS NOT NULL
            LIMIT 1
          ) AS has_data`
        );

        if (dataCheck.rows[0].has_data) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Cannot delete column "${colToDrop.name}" — it contains data. Delete all rows first or keep the column.`,
          });
        }

        // Safe to drop — no data
        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
           DROP COLUMN IF EXISTS "${colToDrop.name}"`
        );
      }

      addNotification(
        `Updated "${displayName}" by ${req.user.employee_name}`, "update", "Edit3"
      );
      await client.query("COMMIT");
      res.json({ message: "Table structure updated successfully" });
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Update table structure error:", err);
    res.status(500).json({ error: "Failed to update table" });
  }
});

module.exports = router;
