export const fetchNotionData = async (): Promise<{
  title: string;
  content: { type: string; text: string }[];
  pageId: string;
}> => {
  const pageId = process.env.EXPO_PUBLIC_BLOCK_ID;
  const headers = {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
  };

  // ページ情報を取得（タイトル用）
  const pageResponse = await fetch(
    `https://api.notion.com/v1/pages/${pageId}`,
    { headers },
  );

  // ブロックを取得（本文用）
  const blocksResponse = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    { headers },
  );

  if (!pageResponse.ok || !blocksResponse.ok) {
    throw new Error("Network response was not ok");
  }

  const pageData = await pageResponse.json();
  const blocksData = await blocksResponse.json();

  // タイトルの取得 (ページの種類によってプロパティ構造が異なる場合があるが、一般的なデータベースページやページを想定)
  let title = "Notion Memo";
  if (pageData.properties) {
    // データベース内のページの場合、プロパティ名は "Name" or "title" などユーザー設定による
    // ここでは汎用的に "title" タイプのプロパティを探すか、あるいは特定のキー（例: "title"）を想定する
    // 通常のスタンドアロンページの場合、properties.title は存在する場合がある

    // Notion API response structure inspection might be needed for specific case,
    // but usually for a page, structure is logic like this:
    const titleProp = Object.values(pageData.properties).find(
      (prop: any) => prop.id === "title" || prop.type === "title",
    ) as any;
    if (titleProp && titleProp.title && titleProp.title.length > 0) {
      title = titleProp.title[0].plain_text;
    }
  }

  const textBlocks = blocksData.results
    .filter((block: any) =>
      //block.typeのうち本文と見出しのみを取得
      ["paragraph", "heading_1", "heading_2", "heading_3"].includes(block.type),
    )
    .map((block: any) => {
      //block[type]: ブロックの種類（例：paragraph）に合わせて、その中身のデータにアクセスしています
      const type = block.type;
      //rich_text: テキストの装飾情報（太字、斜体など）が含まれる配列
      const richText = block[type].rich_text;
      //.map(...): 太字や斜体などで分割されているテキストのかけらから、純粋な文字情報（plain_text）だけを取り出します。
      //.join(""): 取り出したテキストの断片をくっつけて、一つの文字列にします。
      const text = richText.map((t: any) => t.plain_text).join("") || " ";
      return { type, text };
    });

  const content =
    textBlocks.length > 0
      ? textBlocks
      : [
          {
            type: "paragraph",
            text: "内容が空か、読み取れるテキストがありません。",
          },
        ];

  return { title, content, pageId: pageId || "" };
};
