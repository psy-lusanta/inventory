const sanitizeIdentifier = require("./sanitization/sanitizeIdentifiers.js");

function getTableName(deviceType) {
  return sanitizeIdentifier(deviceType);
}

function getFullTableName(deviceType) {
  return `inventory_items.${sanitizeIdentifier(deviceType)}`;
}

module.exports = {
  getTableName,
  getFullTableName,
};
