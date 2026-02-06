import {
  BlockObjectResponse,
  PageObjectResponse,
  PartialBlockObjectResponse,
  PartialPageObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";

export const fetchPageTitle = async (): Promise<string> => {
  const pageId = process.env.EXPO_PUBLIC_BLOCK_ID;
  const headers = {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
  };

  const pageResponse = await fetch(
    `https://api.notion.com/v1/pages/${pageId}`,
    { headers },
  );

  if (!pageResponse.ok) {
    throw new Error("Network response was not ok");
  }

  const pageData = (await pageResponse.json()) as
    | PageObjectResponse
    | PartialPageObjectResponse;

  let title = "Notion Memo";
  if ("properties" in pageData) {
    const titleProp = Object.values(pageData.properties).find(
      (prop) => prop.type === "title",
    );

    if (titleProp && titleProp.type === "title" && titleProp.title.length > 0) {
      title = titleProp.title[0].plain_text;
    }
  }
  return title;
};

export const fetchNotionData = async (): Promise<{
  title: string;
  content: BlockObjectResponse[];
  pageId: string;
}> => {
  const pageId = process.env.EXPO_PUBLIC_BLOCK_ID;
  const headers = {
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
    "Notion-Version": "2022-06-28",
  };

  // ブロックを取得（本文用）
  const blocksResponse = await fetch(
    `https://api.notion.com/v1/blocks/${pageId}/children`,
    { headers },
  );

  if (!blocksResponse.ok) {
    throw new Error("Network response was not ok");
  }

  // 並行してタイトルを取得
  const titlePromise = fetchPageTitle();
  const blocksData = await blocksResponse.json();
  const title = await titlePromise;

  const textBlocks = (
    blocksData.results as (BlockObjectResponse | PartialBlockObjectResponse)[]
  ).filter(
    (block): block is BlockObjectResponse =>
      "type" in block &&
      ["paragraph", "heading_1", "heading_2", "heading_3"].includes(block.type),
  );

  return { title, content: textBlocks, pageId: pageId || "" };
};

export const getTextFromBlock = (block: BlockObjectResponse): string => {
  // @ts-ignore
  const richText: RichTextItemResponse[] = block[block.type]?.rich_text;
  if (!richText) return "";
  return richText.map((t) => t.plain_text).join("");
};
