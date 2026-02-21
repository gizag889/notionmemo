CREATE TABLE IF NOT EXISTS users (
  notion_user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  workspace_name TEXT,
  refresh_token TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS page_caches (
  page_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT,
  content_json TEXT NOT NULL,
  last_fetched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_dirty INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);