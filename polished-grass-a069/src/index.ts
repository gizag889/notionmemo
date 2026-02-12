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
			redirect_uri: 'https://polished-grass-a069.xxx.workers.dev/auth/notion/callback',
		}),
	});

	const tokenData = (await response.json()) as NotionTokenResponse;

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

// テスト専用のエンドポイント
app.get('/test-redirect', (c) => {
  // あなたの app.json で設定した scheme が "myapp" の場合
  return c.redirect('notionmemo://auth-success?user_id=test_user_123')
})

export default app;
