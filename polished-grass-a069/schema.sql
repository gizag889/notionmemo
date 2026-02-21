CREATE TABLE IF NOT EXISTS users (
  notion_user_id TEXT PRIMARY KEY,
  workspace_name TEXT,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  created_at DATETIME DEFAULT (datetime('now', 'localtime')),
  updated_at DATETIME DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE page_caches (
  page_id TEXT PRIMARY KEY, -- NotionのページID
  user_id TEXT NOT NULL, -- usersテーブルのid (誰のトークンでAPIを叩くか)
  
  -- キャッシュデータ
  title TEXT, -- 取得済みのタイトル
  content_json TEXT, -- ウィジェットですぐ表示できるようにパース・整形した本文データ
  
  -- キャッシュ制御用
  last_fetched_at DATETIME NOT NULL, -- 最後にNotion APIからデータ取得・同期した時刻
  is_dirty INTEGER DEFAULT 0, -- 1: ウィジェット側で編集されたが、Notionへ反映完了していないフラグ
  
  FOREIGN KEY (user_id) REFERENCES users(notion_user_id) ON DELETE CASCADE
);