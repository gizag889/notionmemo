import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as SecureStore from "expo-secure-store";
import { getTextFromBlock } from "./notion";

export type WidgetItem =
  | string
  | {
      type: BlockObjectResponse["type"];
      text: string;
    };

const KEY_TEXT = "latest_notion_text";
const KEY_TITLE = "latest_notion_title";
const KEY_PAGE_ID = "latest_notion_page_id";
const KEY_THEME = "widget_theme";

export async function saveWidgetData(
  title: string,
  content: BlockObjectResponse[],
  pageId: string,
) {
  const simpleContent = content.map((block) => ({
    type: block.type,
    text: getTextFromBlock(block),
  }));

  await SecureStore.setItemAsync(KEY_TEXT, JSON.stringify(simpleContent));
  await SecureStore.setItemAsync(KEY_TITLE, title);
  await SecureStore.setItemAsync(KEY_PAGE_ID, pageId);
}

export async function saveWidgetTheme(theme: "light" | "dark") {
  await SecureStore.setItemAsync(KEY_THEME, theme);
}

export async function loadWidgetData(): Promise<{
  title: string;
  items: WidgetItem[];
  pageId: string | null;
  theme: "light" | "dark";
}> {
  const savedText = await SecureStore.getItemAsync(KEY_TEXT);
  const savedTitle = (await SecureStore.getItemAsync(KEY_TITLE)) || "Notion";
  const savedPageId = await SecureStore.getItemAsync(KEY_PAGE_ID);
  const savedTheme = (await SecureStore.getItemAsync(KEY_THEME)) as
    | "light"
    | "dark"
    | null;

  let items: WidgetItem[] = [];

  if (savedText) {
    try {
      const parsed = JSON.parse(savedText);
      if (Array.isArray(parsed)) {
        items = parsed;
      } else {
        // Handle legacy single string case
        items = [String(parsed)];
      }
    } catch (e) {
      // Handle legacy plain text case
      items = [savedText];
    }
  } else {
    items = ["メモがありません"];
  }

  return {
    title: savedTitle,
    items,
    pageId: savedPageId,
    theme: savedTheme || "dark",
  };
}
