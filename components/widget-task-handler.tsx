"use no memo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Linking } from "react-native";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";
import { fetchNotionData } from "../lib/notion";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  // WidgetTaskHandlerPropsからclickAction renderWidgetを分割代入で取り出す
  //これにより、以降の行では props.renderWidget(...) のように書く代わりに、単に renderWidget(...) と記述できるようになっています
  const { clickAction, renderWidget, widgetAction } = props;

  switch (widgetAction) {
    case "WIDGET_UPDATE":
    case "WIDGET_ADDED":
      const savedText = await AsyncStorage.getItem("latest_notion_text");
      const savedTitle =
        (await AsyncStorage.getItem("latest_notion_title")) || "Notion";
      let items: string[] = ["メモがありません"];
      if (savedText) {
        try {
          // JSON配列としてパースを試みる
          items = JSON.parse(savedText);
          if (!Array.isArray(items)) {
            // 配列でない場合は単一文字列として扱う（念のため）
            items = [String(items)];
          }
        } catch (e) {
          // パース失敗時はレガシーデータ（単なる文字列）とみなす
          items = [savedText];
        }
      }
      renderWidget(<WidgetView title={savedTitle} items={items} />);
      break;
    case "WIDGET_CLICK":
      if (clickAction === "OPEN_MAIN") {
        // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
        // props.clickActionData === { id: 0 }
        Linking.openURL("notionmemo://");
      }
      if (clickAction === "OPEN_INPUT") {
        // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
        // props.clickActionData === { id: 0
        Linking.openURL("notionmemo://quick-input");
      }
      if (clickAction === "REFRESH") {
        const data = await fetchNotionData();

        await AsyncStorage.setItem(
          "latest_notion_text",
          JSON.stringify(data.content),
        );
        await AsyncStorage.setItem("latest_notion_title", data.title);
        await AsyncStorage.setItem("latest_notion_page_id", data.pageId);
        renderWidget(<WidgetView title={data.title} items={data.content} />);
      }
      if (clickAction === "OPEN_NOTION") {
        const pageId =
          (await AsyncStorage.getItem("latest_notion_page_id")) ||
          process.env.EXPO_PUBLIC_BLOCK_ID;
        if (pageId) {
          Linking.openURL(`https://www.notion.so/${pageId.replace(/-/g, "")}`);
        }
      }
      break;
    default:
      break;
  }
}
