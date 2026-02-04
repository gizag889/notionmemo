import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";

export const updateWidgetContent = async (data: {
  title: string;
  content: { type: string; text: string }[] | string[];
  pageId: string;
}) => {
  const contentStrings = data.content.map((item) =>
    typeof item === "string" ? item : item.text,
  );

  await AsyncStorage.setItem(
    "latest_notion_text",
    JSON.stringify(contentStrings),
  );
  await AsyncStorage.setItem("latest_notion_title", data.title);
  await AsyncStorage.setItem("latest_notion_page_id", data.pageId);
  requestWidgetUpdate({
    widgetName: "NotionClipboardWidget",
    renderWidget: () => (
      <WidgetView title={data.title} items={contentStrings} />
    ),
  });
};
