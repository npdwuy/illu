-- SQL Schema for Turso (SQLite) Database

CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  caption TEXT,
  likes INTEGER DEFAULT 0,
  time TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS wishes (
  id TEXT PRIMARY KEY,
  name TEXT,
  role TEXT,
  content TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  year INTEGER,
  name TEXT,
  content TEXT,
  image_url TEXT,
  date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
