import { createClient, Client } from '@libsql/client';

let client: Client | null = null;

export function getTursoClient(): Client {
  if (client) return client;

  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || url.includes('your-db-name')) {
    console.warn('TURSO_DATABASE_URL is not configured properly in .env.local');
  }

  client = createClient({
    url: url || 'file:local.db', // Fallback to local SQLite if env not provided yet
    authToken: authToken || undefined,
  });

  return client;
}

/**
 * Ensures all required tables exist in Turso DB.
 */
export async function ensureTablesExist() {
  const db = getTursoClient();
  
  await db.batch([
    `CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      caption TEXT,
      likes INTEGER DEFAULT 0,
      time TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS wishes (
      id TEXT PRIMARY KEY,
      name TEXT,
      role TEXT,
      content TEXT,
      date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      year INTEGER,
      name TEXT,
      content TEXT,
      image_url TEXT,
      date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS party_canvas_stickers (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      x REAL NOT NULL DEFAULT 0,
      y REAL NOT NULL DEFAULT 0,
      width REAL NOT NULL DEFAULT 400,
      height REAL NOT NULL DEFAULT 300,
      description TEXT,
      uploader_name TEXT,
      elevation REAL DEFAULT 10,
      sheen_mode TEXT DEFAULT 'sheen',
      lighting_color TEXT DEFAULT '#ffffff',
      z_index INTEGER DEFAULT 1000,
      updated_at TEXT DEFAULT (datetime('now')),
      created_at TEXT DEFAULT (datetime('now'))
    );`,
    `CREATE TABLE IF NOT EXISTS marquee_images (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      r2_key TEXT,
      title TEXT NOT NULL DEFAULT 'Untitled',
      date TEXT DEFAULT '',
      location TEXT DEFAULT '',
      category TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      description TEXT DEFAULT '',
      aspect_ratio TEXT DEFAULT '4/3',
      row_index INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );`
  ], 'write');

  try {
    await db.execute(`ALTER TABLE party_canvas_stickers ADD COLUMN uploader_name TEXT;`);
  } catch (e) {
    // Column already exists
  }
}
