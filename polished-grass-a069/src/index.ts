import { Hono } from 'hono';

type Bindings = {
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	DB: D1Database; // D1のバインドを追加
};

type NotionTokenResponse = {
	access_token: string;
	token_type: string;
	bot_id: string;
	workspace_name: string;
	workspace_icon: string;
	workspace_id: string;
	owner: {
		type: string;
		user: {
			object: 'user';
			id: string;
			name?: string;
			avatar_url?: string;
			type?: string;
			person?: {
				email: string;
			};
		};
	};
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/auth/notion/callback', async (c) => {
	const clientId = c.env.NOTION_CLIENT_ID;
	const clientSecret = c.env.NOTION_CLIENT_SECRET;
	const code = c.req.query('code');

	if (!code) return c.text('Authorization code not found', 400);

	// Notion API へトークン交換のリクエスト
	const response = await fetch('https://api.notion.com/v1/oauth/token', {
		method: 'POST',
		headers: {
			Authorization: `Basic ${btoa(`${clientId}:${clientSecret}`)}`,
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			grant_type: 'authorization_code',
			code: code,
			redirect_uri: 'https://polished-grass-a069.gizaguri0426.workers.dev/auth/notion/callback',
		}),
	});

	const tokenData = (await response.json()) as NotionTokenResponse;

// app/index.ts に追加

// Notionからページ一覧を取得するエンドポイント
app.get('/get-pages', async (c) => {
  const userId = c.req.query('user_id');
  if (!userId) return c.json({ error: 'User ID is required' }, 400);

  // 1. D1からアクセストークンを取得
  const user = await c.env.DB.prepare(
    "SELECT access_token FROM users WHERE notion_user_id = ?"
  ).bind(userId).first<{ access_token: string }>();

  if (!user) return c.json({ error: 'User not found' }, 404);

  // 2. Notion APIを叩いて、連携済みのページ一覧を取得
  const response = await fetch('https://api.notion.com/v1/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${user.access_token}`,
      'Notion-Version': '2022-06-28', // 現在の安定版バージョン
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filter: { property: 'object', value: 'page' },
      page_size: 10,
    }),
  });

  const data = await response.json();
  return c.json(data);
});

	// ユーザーIDとアクセストークンの抽出
	const notionUserId = tokenData.owner?.user?.id;
	const accessToken = tokenData.access_token;

	if (notionUserId && accessToken) {
		// D1 データベースに保存（既存の場合は更新）
		await c.env.DB.prepare(
			`
      INSERT INTO users (notion_user_id, access_token, workspace_name, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(notion_user_id) DO UPDATE SET
        access_token = excluded.access_token,
        updated_at = CURRENT_TIMESTAMP
    `,
		)
			.bind(notionUserId, accessToken, tokenData.workspace_name)
			.run();

		// Androidアプリにリダイレクト（カスタムURLスキームを使用）
		return c.redirect(`notionmemo://auth-success?user_id=${notionUserId}`);
	}

	return c.json({ error: 'Failed to obtain token' }, 400);
});

export default app;
