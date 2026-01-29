// Remove anything unsafe for SQL identifiers (table names, column names)
function sanitizeIdentifier(name) {
  if (!name) return null;

  // Only allow: letters, numbers, underscore
  const cleaned = name.replace(/[^a-zA-Z0-9_]/g, "").toLowerCase();

  if (cleaned.length === 0) return null;

  return cleaned;
}

module.exports = sanitizeIdentifier;
