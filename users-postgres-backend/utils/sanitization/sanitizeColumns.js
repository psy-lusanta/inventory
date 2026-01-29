const sanitizeIdentifier = require("./sanitizeIdentifiers");

// Allowed SQL column types
const VALID_TYPES = new Set([
  "text",
  "varchar",
  "integer",
  "bigint",
  "boolean",
  "date",
  "timestamp",
  "json",
  "jsonb"
]);

// Validate column definitions coming from frontend
function sanitizeColumns(columns) {
  if (!Array.isArray(columns)) return null;

  const sanitized = [];

  for (const col of columns) {
    const name = sanitizeIdentifier(col.name);
    const type = col.type?.toLowerCase();
    const required = col.required === true;

    if (!name) continue;
    if (!VALID_TYPES.has(type)) continue;

    sanitized.push({ name, type, required });
  }

  return sanitized.length > 0 ? sanitized : null;
}

module.exports = sanitizeColumns;
