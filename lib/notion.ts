import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
  SearchResponse,
} from "@notionhq/client/build/src/api-endpoints";

export const getTextFromBlock = (block: BlockObjectResponse): string => {
  // @ts-ignore
  const richText: RichTextItemResponse[] = block[block.type]?.rich_text;
  if (!richText) return "";
  return richText.map((t) => t.plain_text).join("");
};

// 1. Get pages to find the first one (simulating the logic that was on backend)
// We use the existing /get-pages endpoint which calls v1/search
export const resolveUserPage = async (
  userId: string,
): Promise<{ title: string; pageId: string }> => {
  const pagesResponse = await fetch(
    //index.tsの/get-pagesを呼び出す
    `https://polished-grass-a069.gizaguri0426.workers.dev/get-pages?user_id=${userId}`,
  );

  if (!pagesResponse.ok) {
    throw new Error("Failed to fetch pages");
  }

  const pagesData = (await pagesResponse.json()) as SearchResponse;
  const pagesResults = pagesData.results;

  if (!pagesResults || pagesResults.length === 0) {
    return { title: "No Pages Found", pageId: "" };
  }

  // Use the first page
  const page = pagesResults[0];
  const pageId = page.id;
  let title = "Notion Memo";

  if ("properties" in page) {
    const titleProp = Object.values(page.properties).find(
      (prop) => prop.type === "title",
    );
    if (titleProp && titleProp.type === "title" && titleProp.title.length > 0) {
      title = titleProp.title[0].plain_text;
    }
  }

  return { title, pageId };
};

// Helper for quick-input.tsx to get just the title
export const fetchPageTitle = async (userId: string): Promise<string> => {
  const { title } = await resolveUserPage(userId);
  return title;
};

// Update return type to include title and pageId
export const fetchUserBlocks = async (
  userId: string,
): Promise<{
  title: string;
  content: BlockObjectResponse[];
  pageId: string;
}> => {
  const { title, pageId } = await resolveUserPage(userId);

  // 2. Fetch blocks for this specific page
  const response = await fetch(
    `https://polished-grass-a069.gizaguri0426.workers.dev/get-blocks?user_id=${userId}&page_id=${pageId}`,
  );

  if (!response.ok) {
    throw new Error("Failed to fetch blocks");
  }
  const data = await response.json();

  // Handle both array and object formats depending on the worker's response
  const rawResults = Array.isArray(data) ? data : data.results;

  if (!rawResults || !Array.isArray(rawResults)) {
    console.error("Invalid data format received:", data);
    return { title, content: [], pageId };
  }

  const results = rawResults as (
    | BlockObjectResponse
    | PartialBlockObjectResponse
  )[];


  // Filter for valid BlockObjectResponse
  const content = results.filter(
    (block): block is BlockObjectResponse => "type" in block,
  );

  return { title, content, pageId };
};
