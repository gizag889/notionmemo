-- Migration number: 0001 	 2026-02-21T17:31:23.700Z
ALTER TABLE users ADD COLUMN refresh_token TEXT;
