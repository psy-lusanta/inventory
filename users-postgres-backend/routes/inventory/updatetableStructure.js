// routes/inventory/updateTableStructure.js
const express = require("express");
const router = express.Router();
const { query, pool } = require("../../config/db.js");
const sanitizeIdentifier = require("../../utils/sanitization/sanitizeIdentifiers.js");
const { addNotification } = require("../../utils/addNotification.js");

const quoteIfNeeded = (name) => {
  if (!name) return name;
  if (name.includes(" ") || /[^a-zA-Z0-9_]/.test(name)) {
    return `"${name.replace(/"/g, '""')}"`;
  }
  return name;
};

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
        name: row.column_name,
        type: row.data_type.toUpperCase(),
      }));

      const desiredCols = columns
        .filter((col) => col.name?.trim())
        .map((col) => {
          let colName = col.name.trim();

          if (!colName) return null;

          return {
            oldName: null,
            name: colName,
            type: (col.type || "TEXT").toUpperCase(),
          };
        })
        .filter(Boolean);

      const minLength = Math.min(currentCols.length, desiredCols.length);
      for (let i = 0; i < minLength; i++) {
        const desired = desiredCols[i];
        if (!desired || !desired.name.trim()) {
          console.warn(`Skipping invalid column at index ${i}`);
          continue;
        }

        const quotedDesired = quoteIfNeeded(desired.name);
        const quotedCurrent = quoteIfNeeded(currentCols[i].name);

        if (currentCols[i].name !== desired.name) {
          console.log(`Renaming ${quotedCurrent} → ${quotedDesired}`);
          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
       RENAME COLUMN ${quotedCurrent} TO ${quotedDesired}`,
          );
        }

        if (currentCols[i].type !== desired.type) {
          console.log(`Changing type for ${quotedDesired} to ${desired.type}`);
          await client.query(
            `ALTER TABLE inventory_items."${sanitizedTable}"
       ALTER COLUMN ${quotedDesired} TYPE ${desired.type}
       USING ${quotedDesired}::${desired.type}`,
          );
        }
      }

      for (let i = currentCols.length; i < desiredCols.length; i++) {
        const desired = desiredCols[i];
        const quoted = quoteIfNeeded(desired.name);
        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
     ADD COLUMN IF NOT EXISTS ${quoted} ${desired.type}`,
        );
      }

      for (let i = desiredCols.length; i < currentCols.length; i++) {
        const colToDrop = currentCols[i];
        const quoted = quoteIfNeeded(colToDrop.name);

        const dataCheck = await client.query(
          `SELECT EXISTS (
      SELECT 1 FROM inventory_items."${sanitizedTable}"
      WHERE ${quoted} IS NOT NULL
      LIMIT 1
    ) AS has_data`,
        );

        if (dataCheck.rows[0].has_data) {
          await client.query("ROLLBACK");
          return res.status(400).json({
            error: `Cannot delete column "${colToDrop.name}" — it contains data. Delete all rows first or keep the column.`,
          });
        }

        await client.query(
          `ALTER TABLE inventory_items."${sanitizedTable}"
     DROP COLUMN IF EXISTS ${quoted}`,
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
    res.status(500).json({ error: "Failed to update table" });
  }
});

module.exports = router;
