const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  host: process.env.PGHOST,
  port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
  database: process.env.PGDATABASE,
  max: process.env.PG_MAX_CLIENTS ? Number(process.env.PG_MAX_CLIENTS) : 10, // pool size
  idleTimeoutMillis: process.env.PG_IDLE_MS ? Number(process.env.PG_IDLE_MS) : 30000, // close idle clients after 30s
  connectionTimeoutMillis: process.env.PG_CONN_TIMEOUT_MS ? Number(process.env.PG_CONN_TIMEOUT_MS) : 2000, // return an error after 2s if connection cannot be established
  // If you use managed DBs like RDS with SSL, set PG_USE_SSL=true and provide proper certs if needed.
  ssl: process.env.PG_USE_SSL === "true" ? { rejectUnauthorized: false } : false,
});

// centralized query helper (uses parameterized queries)
async function query(text, params) {
  return pool.query(text, params);
}

// get a client for transactions: const client = await getClient(); await client.query('BEGIN'); ...
async function getClient() {
  const client = await pool.connect();
  // attach a simple timeout guard for leaked clients in development (optional)
  const timeout = setTimeout(() => {
    console.error("A client has been checked out for more than 5 seconds!");
    console.error("This is likely a client leak.");
  }, 5000);
  const release = client.release;
  client.release = () => {
    clearTimeout(timeout);
    release.call(client);
  };
  return client;
}

// basic pool error handling
pool.on("error", (err) => {
  console.error("Unexpected error on idle PostgreSQL client", err);
  // process.exit(1); // optional: decide whether to crash the process
});

let _closing = false;

async function closePool() {
  if (_closing || pool.ended) {
    // already closing/closed, no-op
    return;
  }
  _closing = true;
  try {
    await pool.end();
    console.log("Postgres pool has ended");
  } catch (err) {
    console.error("Error closing Postgres pool", err);
  } finally {
    _closing = false;
  }
}

// use once to avoid registering multiple handlers causing repeated calls
process.once("SIGTERM", closePool);
process.once("SIGINT", closePool);

module.exports = {
  query,
  getClient,
  pool,
  closePool,
};