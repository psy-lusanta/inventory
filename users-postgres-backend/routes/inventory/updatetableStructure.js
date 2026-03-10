const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const { addNotification } = require("../../utils/addNotification.js");

function toSnakeCase(str) {
  return str
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/[^a-z0-9_]/g, "")
    .toLowerCase();
}

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
        ],
      );

      const currentRes = await client.query(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = 'inventory_items'
           AND table_name = $1
           AND column_name NOT IN ('id', 'asset_tag', 'created_at', 'created_by', 'updated_at', 'updated_by', 'status')`,
        [sanitizedTable],
      );

      const currentCols = currentRes.rows.map((row) => ({
        originalName: row.column_name,
        snakeName: toSnakeCase(row.column_name),
        type: row.data_type.toUpperCase(),
      }));

      const desiredCols = columns
        .filter((col) => col.name?.trim())
        .map((col) => {
          const frontendName = col.name.trim();
          const snakeName = toSnakeCase(frontendName);

          if (!snakeName) return null;

          return {
            originalName: frontendName, 
            snakeName: snakeName,
            type: (col.type || "TEXT").toUpperCase(),
          };
        })
        .filter(Boolean);

      const minLength = Math.min(currentCols.length, desiredCols.length);
      for (let i = 0; i < minLength; i++) {
        const current = currentCols[i];
        const desired = desiredCols[i];

        if (current.snakeName !== desired.snakeName) {
          console.log(`Renaming ${current.originalName} → ${desired.originalName} (snake: ${desired.snakeName})`);

          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
             RENAME COLUMN "${current.originalName}" TO "${desired.snakeName}"`
          );
        }

        if (current.type !== desired.type) {
          console.log(`Changing type for ${desired.snakeName} to ${desired.type}`);
          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
             ALTER COLUMN "${desired.snakeName}" TYPE ${desired.type}
             USING "${desired.snakeName}"::${desired.type}`,
          );
        }
      }

      for (let i = currentCols.length; i < desiredCols.length; i++) {
        const desired = desiredCols[i];
        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
           ADD COLUMN IF NOT EXISTS "${desired.snakeName}" ${desired.type}`,
        );
      }

      for (let i = desiredCols.length; i < currentCols.length; i++) {
        const colToDrop = currentCols[i];

        const dataCheck = await client.query(
          `SELECT EXISTS (
             SELECT 1 FROM inventory_items."${sanitizedTable}"
             WHERE "${colToDrop.originalName}" IS NOT NULL
             LIMIT 1
           ) AS has_data`,
        );

        if (dataCheck.rows[0].has_data) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Cannot delete column "${colToDrop.originalName}" — it contains data.`,
          });
        }

        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
           DROP COLUMN IF EXISTS "${colToDrop.originalName}"`,
        );
      }

      addNotification(
        `Updated "${displayName}" by ${req.user.employee_name}`,
        "update",
        "Edit3",
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
    res.status(500).json({ error: "Failed to update table: " + err.message });
  }
});

module.exports = router;