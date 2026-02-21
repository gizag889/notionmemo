-- Migration number: 0001 	 2026-02-21T20:16:57.992Z
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL
);