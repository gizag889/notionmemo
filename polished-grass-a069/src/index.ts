import { Hono } from 'hono';

type Bindings = {
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	memo_app_db: D1Database; // D1のバインドを追加
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

//ユーザーがNotionの認証画面（「アクセスを許可しますか？」のような画面）で**「ページを選択」して許可ボタンを押した後**に実行
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
			//OAuthの「どのフローか」を指定
			grant_type: 'authorization_code',
			code: code,
			//Oauthは認可時に指定した redirect_uri と完全一致しないとトークン交換できない
			redirect_uri: 'https://polished-grass-a069.gizaguri0426.workers.dev/auth/notion/callback',
		}),
	});

	const tokenData = (await response.json()) as NotionTokenResponse;

	// ユーザーIDとアクセストークンの抽出
	const notionUserId = tokenData.owner?.user?.id;
	const accessToken = tokenData.access_token;

	if (notionUserId && accessToken) {
		// D1 データベースに保存（既存の場合は更新）
		await c.env.memo_app_db
			.prepare(
				//VALUESの部分はstmt.bind(notionUserId, accessToken, workspaceName)のようになる
				//ON CONFLICT:notion_user_id が UNIQUE制約 または PRIMARY KEY である前提。
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

//そのページ内のブロック一覧を取得するエンドポイント
app.get('/get-blocks', async (c) => {
	const userId = c.req.query('user_id');
	const pageId = c.req.query('page_id');

	if (!userId) return c.json({ error: 'User ID is required' }, 400);
	if (!pageId) return c.json({ error: 'Page ID is required' }, 400);

	// 1. D1からアクセストークンを取得
	const user = await c.env.memo_app_db
		.prepare('SELECT access_token FROM users WHERE notion_user_id = ?')
		.bind(userId)
		.first<{ access_token: string }>();

	if (!user) return c.json({ error: 'User not found' }, 404);

	// 3. ブロック一覧を取得
	const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
		headers: {
			Authorization: `Bearer ${user.access_token}`,
			'Notion-Version': '2022-06-28',
		},
	});

	if (!response.ok) {
		return c.json({ error: 'Network response was not ok' }, 500);
	}

	const data = (await response.json()) as any;
	// タイトルを含めて返す (タイトルはクライアント側で取得済みなので、ここでは空文字または省略可だが、互換性のためにキーだけ残すか、シンプルにresultsだけ返す)
	// クライアントは title を /get-pages の結果から使っているので、ここは results だけ返せば本来十分。
	// ただし lib/notion.ts の実装では title は /get-pages から取っているので、ここの title は無視されるはず。
	return c.json({ results: data.results });
});

// ページ一覧を取得するエンドポイント（検索APIを使用）
app.get('/get-pages', async (c) => {
	const userId = c.req.query('user_id');

	if (!userId) return c.json({ error: 'User ID is required' }, 400);

	// 1. D1からアクセストークンを取得
	const user = await c.env.memo_app_db
		.prepare('SELECT access_token FROM users WHERE notion_user_id = ?')
		.bind(userId)
		.first<{ access_token: string }>();

	if (!user) return c.json({ error: 'User not found' }, 404);

	// 2. Notion API (Search) を使用してページを検索
	const response = await fetch('https://api.notion.com/v1/search', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${user.access_token}`,
			'Notion-Version': '2022-06-28',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			filter: {
				value: 'page',
				property: 'object',
			},
			sort: {
				direction: 'descending',
				timestamp: 'last_edited_time',
			},
		}),
	});

	if (!response.ok) {
		return c.json({ error: 'Failed to fetch pages from Notion' }, 500);
	}

	const data = (await response.json()) as any;
	return c.json(data);
});



app.post('/add-memo', async (c) => {
	const { user_id, content, page_id } = await c.req.json();

	if (!user_id || !content || !page_id) {
		return c.json({ error: 'パラメータが不足しています' }, 400);
	}

	// 1. D1から最新のアクセストークンを取得
	const user = await c.env.memo_app_db
		.prepare('SELECT access_token FROM users WHERE notion_user_id = ?')
		.bind(user_id)
		.first<{ access_token: string }>();

	if (!user) return c.json({ error: 'ユーザーが見つかりません' }, 404);

	// 2. Notion API: 指定したページ（block_id）の末尾にテキストを追加
	// PATCHメソッドを使用します
	const notionResponse = await fetch(`https://api.notion.com/v1/blocks/${page_id}/children`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${user.access_token}`,
			'Notion-Version': '2022-06-28',
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			children: [
				{
					object: 'block',
					type: 'paragraph',
					paragraph: {
						rich_text: [
							{
								type: 'text',
								text: { content: content },
							},
						],
					},
				},
			],
		}),
	});

	const result = await notionResponse.json();

	if (!notionResponse.ok) {
		return c.json({ error: 'Notionへの書き込みに失敗しました', details: result }, 500);
	}

	return c.json({ message: '成功！', data: result });
});

export default app;
