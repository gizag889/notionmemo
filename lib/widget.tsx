import AsyncStorage from "@react-native-async-storage/async-storage";
import React from "react";
import { requestWidgetUpdate } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";

export const updateWidgetContent = async (content: string[]) => {
  await AsyncStorage.setItem("latest_notion_text", JSON.stringify(content));
  requestWidgetUpdate({
    widgetName: "NotionClipboardWidget",
    renderWidget: () => <WidgetView items={content} />,
  });
};
