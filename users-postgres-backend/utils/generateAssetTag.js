const sanitizeIdentifier = require("../utils/sanitization/sanitizeIdentifiers.js");
const { query, pool } = require("../config/db.js");

// Generate an asset tag PER table
async function generateAssetTag(tableName, prefix) {
  const cleanTable = sanitizeIdentifier(tableName);

  // prefix example: "LX_DVO_LAP"
  const cleanPrefix = prefix.trim().toUpperCase();

  // Count existing rows to determine next sequence
  const result = await query(
    `SELECT COUNT(*) AS count FROM inventory_items.${cleanTable}`
  );

  const nextNumber = Number(result.rows[0].count) + 1;

  // Format number → 001, 002, 003...
  const padded = String(nextNumber).padStart(3, "0");

  return `${cleanPrefix}${padded}`;
}

module.exports = generateAssetTag;
