import fs from "node:fs";
import path from "node:path";
import { createPool } from "@vercel/postgres";

function loadDotEnv(filepath) {
  if (!fs.existsSync(filepath)) {
    return;
  }

  const envText = fs.readFileSync(filepath, "utf8");

  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) continue;

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const sqlFile = process.argv[2];

if (!sqlFile) {
  console.error("Usage: node scripts/run-sql.mjs <sql-file>");
  process.exit(1);
}

const rootDir = process.cwd();
loadDotEnv(path.join(rootDir, ".env.local"));

const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  console.error("Missing POSTGRES_URL or DATABASE_URL in environment.");
  process.exit(1);
}

const absoluteSqlPath = path.resolve(rootDir, sqlFile);
const sqlText = fs.readFileSync(absoluteSqlPath, "utf8");
const db = createPool({ connectionString });
const client = await db.connect();

try {
  await client.query(sqlText);
  console.log(`Executed SQL file successfully: ${absoluteSqlPath}`);
} finally {
  client.release();
  await db.end();
}
