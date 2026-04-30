import {
  BlockObjectResponse,
  PartialBlockObjectResponse,
  RichTextItemResponse,
  SearchResponse,
} from "@notionhq/client/build/src/api-endpoints";

const API_BASE_URL = "https://viewer-memo.gizaguri0426.workers.dev";

export const fetchUserInfo = async (
  token: string,
): Promise<{ user_id: string; app_user_id: string | null }> => {
  const response = await fetch(`${API_BASE_URL}/auth/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (!response.ok) throw new Error("Failed to verify token");
  return response.json();
};

export const getTextFromBlock = (block: BlockObjectResponse): string => {
  if (block.type === "child_page") {
    return (block as any).child_page.title;
  }
  // @ts-ignore
  const richText: RichTextItemResponse[] = block[block.type]?.rich_text;
  if (!richText) return "";
  return richText.map((t) => t.plain_text).join("");
};

// 1. Get pages to find the first one (simulating the logic that was on backend)
// We use the existing /get-pages endpoint which calls v1/search
export const resolveUserPage = async (
  token: string,
): Promise<{ title: string; pageId: string }> => {
  const pagesResponse = await fetch(
    //index.tsの/get-pagesを呼び出す
    `${API_BASE_URL}/get-pages?_t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );

  if (!pagesResponse.ok) {
    throw new Error("Failed to fetch pages");
  }

  const pagesData = (await pagesResponse.json()) as SearchResponse;
  const pagesResults = pagesData.results;

  if (!pagesResults || pagesResults.length === 0) {
    return { title: "No Pages Found", pageId: "" };
  }

  // Create a set of all page IDs in the results for quick lookup
  const resultIds = new Set(pagesResults.map((p) => p.id));

  // Find the true "root" page (the one whose parent is not among the fetched results)
  // Search results are sorted by last_edited_time desc, so multiple roots will resolve to the most recently edited one.
  let rootPage = pagesResults[0];

  for (const page of pagesResults) {
    const p = page as any;
    if (!p.parent) continue;

    if (p.parent.type === "workspace") {
      rootPage = page;
      break;
    } else if (
      p.parent.type === "page_id" &&
      !resultIds.has(p.parent.page_id)
    ) {
      rootPage = page;
      break;
    } else if (
      p.parent.type === "database_id" &&
      !resultIds.has(p.parent.database_id)
    ) {
      rootPage = page;
      break;
    } else if (
      p.parent.type === "block_id" &&
      !resultIds.has(p.parent.block_id)
    ) {
      rootPage = page;
      break;
    }
  }

  const page = rootPage;
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
export const fetchPageTitle = async (token: string): Promise<string> => {
  const { title } = await resolveUserPage(token);
  return title;
};

// Update return type to include title and pageId
export const fetchUserBlocks = async (
  token: string,
  forceRefresh: boolean = false
): Promise<{
  title: string;
  content: BlockObjectResponse[];
  pageId: string;
}> => {
  const { title, pageId } = await resolveUserPage(token);

  // 2. Fetch blocks for this specific page
  const response = await fetch(
    `${API_BASE_URL}/get-blocks?page_id=${pageId}&force_refresh=${forceRefresh}&_t=${Date.now()}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
      },
    },
  );

  if (!response.ok) {
    throw new Error("Failed to fetch blocks");
  }

  const data = await response.json();
  const results = data.results as (
    | BlockObjectResponse
    | PartialBlockObjectResponse
  )[];

  // Filter for valid BlockObjectResponse and slice to max 30 to prevent Widget crashes
  const content = results
    .filter((block): block is BlockObjectResponse => "type" in block)
    .slice(0, 50);

  return { title, content, pageId };
};
