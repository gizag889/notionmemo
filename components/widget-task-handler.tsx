"use no memo";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as SecureStore from "expo-secure-store";
import { Linking } from "react-native";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";
import { fetchUserBlocks, getTextFromBlock } from "../lib/notion";
import { loadWidgetData, saveWidgetData } from "../lib/widget-storage";
import { getAuthData } from "../utils/storage";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  // WidgetTaskHandlerPropsからclickAction renderWidgetを分割代入で取り出す
  //これにより、以降の行では props.renderWidget(...) のように書く代わりに、単に renderWidget(...) と記述できるようになっています
  const { clickAction, renderWidget, widgetAction } = props;

  switch (widgetAction) {
    case "WIDGET_UPDATE":
    case "WIDGET_ADDED":
      const { title, items } = await loadWidgetData();
      renderWidget(<WidgetView title={title} items={items} />);
      break;
    case "WIDGET_CLICK":
      if (clickAction === "OPEN_MAIN") {
        Linking.openURL("notionmemo://");
      }
      if (clickAction === "OPEN_INPUT") {
        Linking.openURL("notionmemo://quick-input");
      }
      if (clickAction === "REFRESH") {
        // 現在のデータを取得して表示（ローディング状態）
        const { title: currentTitle, items: currentItems } =
          await loadWidgetData();

        // ローディング状態をtrueにして描画
        renderWidget(
          <WidgetView
            title={currentTitle}
            items={currentItems}
            isLoading={true}
          />,
        );

        // データ取得
        const userId = await getAuthData();
        if (!userId) {
          renderWidget(<WidgetView title="Notion" items={["Please login"]} />);
          return;
        }

        const data = await fetchUserBlocks(userId);

        await saveWidgetData(data.title, data.content, data.pageId);

        const simpleContent = data.content.map(
          (block: BlockObjectResponse) => ({
            type: block.type,
            text: getTextFromBlock(block),
          }),
        );

        // ローディング完了（isLoading=false）で描画
        renderWidget(<WidgetView title={data.title} items={simpleContent} />);
      }
      if (clickAction === "OPEN_NOTION") {
        const pageId =
          (await SecureStore.getItemAsync("latest_notion_page_id")) ||
          process.env.EXPO_PUBLIC_BLOCK_ID;
        if (pageId) {
          Linking.openURL(`https://www.notion.so/${pageId.replace(/-/g, "")}`);
        }
      }
      // if (clickAction === "COPY") {
      //   const savedText = await SecureStore.getItemAsync("latest_notion_text");
      //   if (savedText) {
      //     try {
      //       const parsed = JSON.parse(savedText);
      //       let textToCopy = "";

      //       if (Array.isArray(parsed)) {
      //         textToCopy = parsed
      //           .map((item) => (typeof item === "string" ? item : item.text))
      //           .join("\n");
      //       } else {
      //         textToCopy = String(parsed);
      //       }

      //       if (textToCopy) {
      //         await Clipboard.setStringAsync(textToCopy);
      //       }
      //     } catch (e) {
      //       // Fallback for plain text legacy data
      //       await Clipboard.setStringAsync(savedText);
      //     }
      //   }
      // }
      break;
    default:
      break;
  }
}
