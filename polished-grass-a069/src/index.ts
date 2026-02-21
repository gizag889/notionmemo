import { Hono } from 'hono';

type Bindings = {
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	notion_memo: D1Database; // D1のバインドを追加
};

type NotionTokenResponse = {
	access_token: string;
	refresh_token?: string;
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

// キャッシュの有効期限（ミリ秒）例：5分
const CACHE_TTL = 5 * 60 * 1000;

// Notion連携を開始するエンドポイント
app.get('/auth/notion/login', async (c) => {
	const clientId = c.env.NOTION_CLIENT_ID;
	const redirectUri = 'https://polished-grass-a069.gizaguri0426.workers.dev/auth/notion/callback';
	const state = crypto.randomUUID();

	// 状態をD1に保存（現在時刻のミリ秒も保存）
	await c.env.notion_memo.prepare('INSERT INTO oauth_states (state, created_at) VALUES (?, ?)').bind(state, Date.now()).run();

	const authUrl = `https://api.notion.com/v1/oauth/authorize?owner=user&client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=${state}`;
	return c.redirect(authUrl);
});

//ユーザーがNotionの認証画面（「アクセスを許可しますか？」のような画面）で**「ページを選択」して許可ボタンを押した後**に実行
app.get('/auth/notion/callback', async (c) => {
	const clientId = c.env.NOTION_CLIENT_ID;
	const clientSecret = c.env.NOTION_CLIENT_SECRET;
	const code = c.req.query('code');
	const state = c.req.query('state');

	if (!code) return c.text('Authorization code not found', 400);
	if (!state) return c.text('State parameter is missing', 400);

	// stateの検証と削除
	const stateResult = await c.env.notion_memo
		.prepare('SELECT state FROM oauth_states WHERE state = ?')
		.bind(state)
		.first<{ state: string }>();

	if (!stateResult) {
		return c.text('Invalid or expired state parameter', 400);
	}

	await c.env.notion_memo.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run();

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

	// ユーザーIDとアクセストークンなどの抽出
	const notionUserId = tokenData.owner?.user?.id;
	const accessToken = tokenData.access_token;
	const refreshToken = tokenData.refresh_token;

	if (notionUserId && accessToken) {
		// D1 データベースに保存（既存の場合は更新）
		await c.env.notion_memo
			.prepare(
				//VALUESの部分はstmt.bind(notionUserId, accessToken, workspaceName)のようになる
				//ON CONFLICT:notion_user_id が UNIQUE制約 または PRIMARY KEY である前提。
				//もし notion_user_id がすでに存在していた場合は、その行のaccess_tokenとworkspace_nameを更新する
				`
      INSERT INTO users (notion_user_id, access_token, workspace_name, refresh_token, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(notion_user_id) DO UPDATE SET
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        updated_at = CURRENT_TIMESTAMP
    `,
			)
			.bind(notionUserId, accessToken, tokenData.workspace_name, refreshToken || null)
			.run();

		// Androidアプリにリダイレクト（カスタムURLスキームを使用）
		return c.redirect(`notionmemo://auth-success?user_id=${notionUserId}`);
	}

	return c.json({ error: 'Failed to obtain token' }, 400);
});

//そのページ内のブロック一覧を取得するエンドポイント（SWRキャッシュ対応）
app.get('/get-blocks', async (c) => {
	const userId = c.req.query('user_id');
	const pageId = c.req.query('page_id');

	if (!userId) return c.json({ error: 'User ID is required' }, 400);
	if (!pageId) return c.json({ error: 'Page ID is required' }, 400);

	// 1. D1から現在のキャッシュを取得
	const cacheRecord = await c.env.notion_memo.prepare('SELECT * FROM page_caches WHERE page_id = ?').bind(pageId).first<{
		page_id: string;
		user_id: string;
		title: string | null;
		content_json: string;
		last_fetched_at: string;
		is_dirty: number;
	}>();

	// Notionから最新データを取得してD1を更新する非同期関数
	const fetchAndUpdateNotionData = async () => {
		try {
			// D1からアクセストークンを取得
			const user = await c.env.notion_memo
				.prepare('SELECT access_token FROM users WHERE notion_user_id = ?')
				.bind(userId)
				.first<{ access_token: string }>();

			if (!user) {
				console.error('User not found for background update');
				return;
			}

			// Notion APIから最新のブロック一覧を取得
			const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
				headers: {
					Authorization: `Bearer ${user.access_token}`,
					'Notion-Version': '2022-06-28',
				},
			});

			if (!response.ok) {
				console.error('Failed to fetch from Notion:', await response.text());
				return;
			}

			const data = (await response.json()) as any;
			const contentJson = JSON.stringify({ results: data.results });

			// D1のキャッシュを上書き更新
			await c.env.notion_memo
				.prepare(
					`
					INSERT INTO page_caches (page_id, user_id, content_json, last_fetched_at, is_dirty)
					VALUES (?, ?, ?, CURRENT_TIMESTAMP, 0)
					ON CONFLICT(page_id) DO UPDATE SET 
						user_id = excluded.user_id,
						content_json = excluded.content_json,
						last_fetched_at = CURRENT_TIMESTAMP
				`,
				)
				.bind(pageId, userId, contentJson)
				.run();

			console.log(`[Cache Updated] Page: ${pageId}`);
		} catch (error) {
			console.error('Notion APIの取得またはD1の更新に失敗しました:', error);
		}
	};

	// 2. キャッシュが存在しない場合 (初回リクエスト)
	if (!cacheRecord) {
		await fetchAndUpdateNotionData();

		// 更新されたばかりのデータを再度D1から取得して返す
		const newCache = await c.env.notion_memo
			.prepare('SELECT content_json FROM page_caches WHERE page_id = ?')
			.bind(pageId)
			.first<{ content_json: string }>();

		if (!newCache) {
			return c.json({ error: 'Failed to fetch blocks' }, 500);
		}

		return c.json(JSON.parse(newCache.content_json));
	}

	// 3. キャッシュが存在する場合 (鮮度チェック)
	// SQLiteのCURRENT_TIMESTAMPで入った値をUTCとしてJSでパース
	const timeString = cacheRecord.last_fetched_at.replace(' ', 'T') + 'Z';
	const lastFetchedAt = new Date(timeString).getTime();

	// パースエラー時（NaN）対策として、念のため代替処理
	const reliableLastFetchedAt = isNaN(lastFetchedAt) ? new Date(cacheRecord.last_fetched_at).getTime() : lastFetchedAt;

	const isStale = Date.now() - reliableLastFetchedAt > CACHE_TTL;

	if (isStale) {
		// キャッシュが古い場合、クライアントを待たせずに裏側で更新処理を走らせる
		c.executionCtx.waitUntil(fetchAndUpdateNotionData());
	}

	// 新鮮な場合も、古い(Stale)場合も、とりあえず手元のキャッシュを返す
	return c.json(JSON.parse(cacheRecord.content_json));
});

// ページ一覧を取得するエンドポイント（検索APIを使用）
app.get('/get-pages', async (c) => {
	const userId = c.req.query('user_id');

	if (!userId) return c.json({ error: 'User ID is required' }, 400);

	// 1. D1からアクセストークンを取得
	const user = await c.env.notion_memo
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
	const user = await c.env.notion_memo
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

	// キャッシュを削除（次回取得時にNotionから最新データを取り直すようにする）
	await c.env.notion_memo.prepare('DELETE FROM page_caches WHERE page_id = ?').bind(page_id).run();

	return c.json({ message: '成功！', data: result });
});

export default {
	fetch: app.fetch,
	async scheduled(event: any, env: Bindings, ctx: ExecutionContext) {
		// 10分前（600,000ミリ秒）以前のstateを削除
		const tenMinutesAgo = Date.now() - 10 * 60 * 1000;
		ctx.waitUntil(env.notion_memo.prepare('DELETE FROM oauth_states WHERE created_at < ?').bind(tenMinutesAgo).run());
	},
};
