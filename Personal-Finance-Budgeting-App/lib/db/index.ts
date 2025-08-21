// lib/db/index.ts
import * as SQLite from "expo-sqlite";

/**
 * Singleton DB (new async API)
 */
let _db: SQLite.SQLiteDatabase | null = null;

export function getDb(): SQLite.SQLiteDatabase {
  if (!_db) {
    // Requires a recent Expo SDK. If you hit issues, ensure SDK is up to date.
    _db = SQLite.openDatabaseSync("app.db");
  }
  return _db!;
}

/**
 * Lightweight async helpers (thin wrappers around the new API)
 */
export async function exec(sql: string): Promise<void> {
  const db = getDb();
  await db.execAsync(sql);
}

export async function run(sql: string, params: any[] = []): Promise<void> {
  const db = getDb();
  await db.runAsync(sql, params);
}

export async function all<T = any>(
  sql: string,
  params: any[] = []
): Promise<T[]> {
  const db = getDb();
  return db.getAllAsync<T>(sql, params);
}

export async function first<T = any>(
  sql: string,
  params: any[] = []
): Promise<T | undefined> {
  const db = getDb();
  const result = await db.getFirstAsync<T>(sql, params);
  return result === null ? undefined : result;
}

/**
 * App meta helpers (schema versioning, simple KV)
 */
async function getMeta(key: string): Promise<string | undefined> {
  const row = await first<{ v: string }>(
    "SELECT v FROM app_meta WHERE k = ? LIMIT 1;",
    [key]
  );
  return row?.v;
}

async function setMeta(key: string, value: string): Promise<void> {
  await run(
    "INSERT INTO app_meta(k, v) VALUES(?, ?) ON CONFLICT(k) DO UPDATE SET v = excluded.v;",
    [key, value]
  );
}

async function getSchemaVersion(): Promise<number> {
  const v = await getMeta("schema_version");
  return v ? Number(v) : 0;
}

async function setSchemaVersion(version: number): Promise<void> {
  await setMeta("schema_version", String(version));
}

/**
 * Initial schema (v1)
 * - Integer amounts in cents to avoid float errors
 * - Foreign keys enabled
 */
const SCHEMA_V1 = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_meta (
  k TEXT PRIMARY KEY,
  v TEXT
);

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT,                         -- e.g., cash, checking, credit
  currency TEXT NOT NULL,            -- e.g., USD
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense','income')),
  icon TEXT,
  color TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  category_id TEXT,
  amount INTEGER NOT NULL,           -- cents
  currency TEXT NOT NULL,
  date TEXT NOT NULL,                -- YYYY-MM-DD
  payee TEXT,
  note TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY(account_id) REFERENCES accounts(id) ON DELETE CASCADE,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  period_start TEXT NOT NULL,        -- YYYY-MM-DD
  period_end TEXT NOT NULL,          -- YYYY-MM-DD
  amount INTEGER NOT NULL,           -- cents
  created_at TEXT NOT NULL,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rules (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,             -- keyword or regex pattern
  category_id TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE CASCADE
);
`;

/**
 * Seed data (runs once on fresh DB)
 */
async function seed(): Promise<void> {
  const now = new Date().toISOString();

  // one default account
  await run(
    `INSERT INTO accounts(id, name, type, currency, created_at)
     VALUES (?, ?, ?, ?, ?);`,
    ["acc_cash", "Cash", "cash", "USD", now]
  );

  // a handful of common categories
  await exec(`
    INSERT INTO categories(id, name, type, icon, color, created_at) VALUES
      ('cat_groceries','Groceries','expense','cart','teal','${now}'),
      ('cat_restaurants','Restaurants','expense','food','orange','${now}'),
      ('cat_transport','Transport','expense','car','purple','${now}'),
      ('cat_rent','Rent','expense','home','red','${now}'),
      ('cat_utilities','Utilities','expense','flash','blue','${now}'),
      ('cat_entertain','Entertainment','expense','music','pink','${now}'),
      ('cat_salary','Salary','income','cash','green','${now}'),
      ('cat_misc','Misc','expense','dots-horizontal','gray','${now}');
  `);
}

/**
 * Run migrations (idempotent)
 * - Creates schema if missing
 * - Applies future migrations when you bump SCHEMA_TARGET_VERSION
 */
const SCHEMA_TARGET_VERSION = 1;

export async function runMigrations(): Promise<void> {
  const db = getDb();

  // Ensure FK and base tables exist
  await exec(SCHEMA_V1);

  const current = await getSchemaVersion();

  // Future example:
  // if (current < 2) {
  //   await exec(`ALTER TABLE transactions ADD COLUMN foo TEXT;`);
  //   await setSchemaVersion(2);
  // }

  if (current === 0) {
    // Fresh DB: set schema version and seed
    await setSchemaVersion(SCHEMA_TARGET_VERSION);

    // Seed only if categories are empty
    const catCount = await first<{ count: number }>(
      "SELECT COUNT(*) AS count FROM categories;"
    );
    if (!catCount || Number(catCount.count) === 0) {
      await seed();
    }
  }
}

/**
 * Convenience read helpers for feature code
 */
export async function getCategoryCount(): Promise<number> {
  const row = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM categories;"
  );
  return Number(row?.count ?? 0);
}

export async function getAccountCount(): Promise<number> {
  const row = await first<{ count: number }>(
    "SELECT COUNT(*) AS count FROM accounts;"
  );
  return Number(row?.count ?? 0);
}
