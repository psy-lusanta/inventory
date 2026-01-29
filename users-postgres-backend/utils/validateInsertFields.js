function validateInsertFields(data) {
  const errors = [];

  for (const [key, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === "") {
      errors.push(`${key} is required`);
      continue;
    }

    // STRING FIELDS
    if (typeof value === "string") {
      if (value.length > 255) {
        errors.push(`${key} is too long`);
      }
      if (/['";]/.test(value)) {
        errors.push(`${key} contains invalid characters`);
      }
    }

    // NUMBERS
    if (typeof value === "number") {
      if (isNaN(value)) {
        errors.push(`${key} must be a valid number`);
      }
    }

    // DATE FIELDS
    if (key.toLowerCase().includes("date")) {
      if (isNaN(Date.parse(value))) {
        errors.push(`${key} is not a valid date`);
      }
    }
  }

  return errors;
}

module.exports = validateInsertFields;
