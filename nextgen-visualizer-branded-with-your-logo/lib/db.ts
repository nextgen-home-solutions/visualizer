import Database from "better-sqlite3";
import type { Database as SqliteDatabase } from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "app.db");

let db: SqliteDatabase | null = null;

export function getDb() {
  if (db) return db;

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = new Database(dbPath);

  db.exec(`
    PRAGMA journal_mode=WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,

      lead_name TEXT,
      lead_email TEXT,
      lead_phone TEXT,
      lead_address TEXT,

      project_type TEXT NOT NULL,
      style TEXT NOT NULL,
      quality TEXT NOT NULL,
      room_size_sqft INTEGER NOT NULL,
      description TEXT NOT NULL,

      selected_products_json TEXT NOT NULL,
      images_json TEXT NOT NULL,
      renders_json TEXT NOT NULL,
      estimate_json TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at);
  `);

  return db;
}
