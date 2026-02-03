import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";

export const updateWidgetContent = async (data: {
  title: string;
  content: string[];
}) => {
  await AsyncStorage.setItem(
    "latest_notion_text",
    JSON.stringify(data.content),
  );
  await AsyncStorage.setItem("latest_notion_title", data.title);
  requestWidgetUpdate({
    widgetName: "NotionClipboardWidget",
    renderWidget: () => <WidgetView title={data.title} items={data.content} />,
  });
};
