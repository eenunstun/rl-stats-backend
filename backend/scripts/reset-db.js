const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

require("dotenv").config({
  path: path.resolve(__dirname, "..", ".env"),
});

async function main() {
  const schemaPath = path.resolve(__dirname, "..", "..", "database", "schema.sql");
  const seedPath = path.resolve(__dirname, "..", "..", "database", "seed.sql");

  const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  const client = await pool.connect();

  try {
    console.log(`Resetting database "${process.env.DB_NAME}" on ${process.env.DB_HOST}:${process.env.DB_PORT || 5432}...`);

    const schemaSql = fs.readFileSync(schemaPath, "utf8");
    const seedSql = fs.readFileSync(seedPath, "utf8");

    await client.query("BEGIN");
    await client.query(schemaSql);
    await client.query(seedSql);
    await client.query("COMMIT");

    console.log("Database schema reset and seed data loaded successfully.");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Database reset failed:");
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();
