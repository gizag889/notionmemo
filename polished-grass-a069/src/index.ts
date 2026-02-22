import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';

type Bindings = {
	NOTION_CLIENT_ID: string;
	NOTION_CLIENT_SECRET: string;
	ENCRYPTION_KEY: string; // アクセストークンの暗号化用キー
	JWT_SECRET: string; // JWT署名用キー
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

// --- 暗号化・復号化ユーティリティ ---
async function getEncryptionKey(secretKey: string): Promise<CryptoKey> {
	//暗号化処理はテキストのままでは行えません。TextEncoder を使って、文字列を UTF-8 形式のバイト列（Uint8Array）に変換します
	//暗号化キーを生成します。ここでは、入力された secretKey を元に、SHA-256 ハッシュを計算し、それを鍵の材料（keyMaterial）として使用しています。
	const keyMaterial = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secretKey));
	//ブラウザの暗号エンジンが安全に扱える CryptoKey オブジェクトに変換します
	return crypto.subtle.importKey('raw', keyMaterial, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);

	// return crypto.subtle.importKey(
	// 'raw',           // 入力形式：生のバイナリデータ
	// keyMaterial,     // 鍵の材料（SHA-256の結果）
	// { name: 'AES-GCM' }, // アルゴリズム：AES-GCMを指定
	// false,           // 抽出不可：この鍵を後からJavaScriptで取り出せないようにする（セキュリティ向上）
	// ['encrypt', 'decrypt'] // 用途：暗号化と復号に使用することを許可
}

async function encryptData(data: string, secretKey: string): Promise<string> {
	if (!secretKey) throw new Error('Encryption key is not set');
	const key = await getEncryptionKey(secretKey);
	//AES-GCM方式において、同じ鍵で複数のデータを暗号化しても、毎回結果が変わるようにするための「使い捨てのランダム値」
	const iv = crypto.getRandomValues(new Uint8Array(12));
	const encodedData = new TextEncoder().encode(data);
	//暗号化の実行
	const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encodedData);

	// iv（12バイト）と ciphertext（暗号文の長さ）を足し合わせた、合計サイズ分の空のメモリ領域を確保
	const combined = new Uint8Array(iv.length + ciphertext.byteLength);
	//確保したメモリ領域の先頭（0番目）から、iv の内容をコピー
	combined.set(iv, 0);
	// iv の直後の位置（iv.length）から、ciphertext の内容をコピー
	combined.set(new Uint8Array(ciphertext), iv.length);

	let binary = '';
	for (let i = 0; i < combined.byteLength; i++) {
		binary += String.fromCharCode(combined[i]);
	}
	//Binary（バイナリ）を ASCII（アスキー）形式(base64)に変換する
	return btoa(binary);
}

async function decryptData(encryptedDataStr: string, secretKey: string): Promise<string> {
	if (!secretKey) throw new Error('Encryption key is not set');
	const key = await getEncryptionKey(secretKey);

	const binaryString = atob(encryptedDataStr);
	const combined = new Uint8Array(binaryString.length);
	for (let i = 0; i < binaryString.length; i++) {
		combined[i] = binaryString.charCodeAt(i);
	}

	const iv = combined.slice(0, 12);
	const ciphertext = combined.slice(12);

	const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext);

	return new TextDecoder().decode(decrypted);
}
// ------------------------------------

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
	let accessToken = tokenData.access_token;
	let refreshToken = tokenData.refresh_token;

	if (notionUserId && accessToken) {
		// アクセストークン（とリフレッシュトークン）をAES-GCMで暗号化
		accessToken = await encryptData(accessToken, c.env.ENCRYPTION_KEY);
		if (refreshToken) {
			refreshToken = await encryptData(refreshToken, c.env.ENCRYPTION_KEY);
		}

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
		const token = await sign(
			{
				user_id: notionUserId,
				exp: Math.floor(Date.now() / 1000) + 60 * 5, // 5 minutes expiration
			},
			c.env.JWT_SECRET,
			'HS256',
		);
		return c.redirect(`notionmemo://auth-success?token=${token}`);
	}

	return c.json({ error: 'Failed to obtain token' }, 400);
});

// JWTを検証してユーザーIDを返すエンドポイント
app.post('/auth/verify', async (c) => {
	try {
		const { token } = await c.req.json();
		if (!token) return c.json({ error: 'Token is required' }, 400);

		const payload = await verify(token, c.env.JWT_SECRET, 'HS256');
		return c.json({ user_id: payload.user_id as string });
	} catch (error) {
		return c.json({ error: 'Invalid or expired token' }, 401);
	}
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

			// 暗号化されたアクセストークンを復号化
			const accessToken = await decryptData(user.access_token, c.env.ENCRYPTION_KEY);

			// Notion APIから最新のブロック一覧を取得
			const response = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
				headers: {
					Authorization: `Bearer ${accessToken}`,
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

	// 暗号化されたアクセストークンを復号化
	const accessToken = await decryptData(user.access_token, c.env.ENCRYPTION_KEY);

	// 2. Notion API (Search) を使用してページを検索
	const response = await fetch('https://api.notion.com/v1/search', {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
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

	// 暗号化されたアクセストークンを復号化
	const accessToken = await decryptData(user.access_token, c.env.ENCRYPTION_KEY);

	// 2. Notion API: 指定したページ（block_id）の末尾にテキストを追加
	// PATCHメソッドを使用します
	const notionResponse = await fetch(`https://api.notion.com/v1/blocks/${page_id}/children`, {
		method: 'PATCH',
		headers: {
			Authorization: `Bearer ${accessToken}`,
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
