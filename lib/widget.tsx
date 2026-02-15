import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";

import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import { getTextFromBlock } from "./notion";
import { saveWidgetData } from "./widget-storage";

export const updateWidgetContent = async (data: {
  title: string;
  content: BlockObjectResponse[];
  pageId: string;
}) => {
  // WidgetView 用にデータを整形（後方互換性維持）
  await saveWidgetData(data.title, data.content, data.pageId);

  // WidgetView 用に変換（表示用）
  const simpleContent = data.content.map((block) => ({
    type: block.type,
    text: getTextFromBlock(block),
  }));

  requestWidgetUpdate({
    widgetName: "NotionClipboardWidget",
    renderWidget: () => <WidgetView title={data.title} items={simpleContent} />,
  });
};
