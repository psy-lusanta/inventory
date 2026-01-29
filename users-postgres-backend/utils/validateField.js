function validateFields(data) {
  if (typeof data !== "object" || data === null) return null;

  const sanitized = {};

  for (const [key, value] of Object.entries(data)) {
    // Ignore empty keys
    if (!key) continue;

    // Determine type and sanitize
    if (typeof value === "string") {
      const clean = value.trim();

      // Reject strings with illegal characters like ; -- or unescaped quotes
      if (/['";]/.test(clean)) return null;

      sanitized[key] = clean;
    }

    else if (typeof value === "number") {
      if (Number.isNaN(value)) return null;
      sanitized[key] = value;
    }

    else if (typeof value === "boolean") {
      sanitized[key] = value;
    }

    else if (value instanceof Date) {
      if (isNaN(value.getTime())) return null;
      sanitized[key] = value.toISOString();
    }

    else if (value === null) {
      sanitized[key] = null;
    }

    // Reject unsupported types (functions, arrays, objects)
    else {
      return null;
    }
  }

  return sanitized;
}

module.exports = validateFields;
