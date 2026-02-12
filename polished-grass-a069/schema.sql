CREATE TABLE IF NOT EXISTS users (
  notion_user_id TEXT PRIMARY KEY,
  access_token TEXT NOT NULL,
  workspace_name TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);