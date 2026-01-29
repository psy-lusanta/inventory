const { query } = require("../config/db.js");

async function ensureSchema() {
  try {
    await query(`CREATE SCHEMA IF NOT EXISTS inventory_items`);
    await query(`CREATE SCHEMA IF NOT EXISTS inventory_meta`);
    await query(`CREATE SCHEMA IF NOT EXISTS activity`);
    console.log("All schemas and tables ensured successfully");
  } catch (err) {
    console.error("Schema/table creation failed:", err);
    throw err; // ← Re-throw so retry loop can catch it!
  }
}

module.exports = ensureSchema;
