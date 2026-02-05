import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";

import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getTextFromBlock } from "./notion";

export const updateWidgetContent = async (data: {
  title: string;
  content: BlockObjectResponse[];
  pageId: string;
}) => {
  // WidgetView 用にデータを整形（後方互換性維持）
  const simpleContent = data.content.map((block) => ({
    type: block.type,
    text: getTextFromBlock(block),
  }));

  await AsyncStorage.setItem(
    "latest_notion_text",
    JSON.stringify(simpleContent),
  );
  await AsyncStorage.setItem("latest_notion_title", data.title);
  await AsyncStorage.setItem("latest_notion_page_id", data.pageId);
  requestWidgetUpdate({
    widgetName: "NotionClipboardWidget",
    renderWidget: () => <WidgetView title={data.title} items={simpleContent} />,
  });
};
