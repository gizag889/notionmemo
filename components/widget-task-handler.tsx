"use no memo";
import type { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import React from "react";
import { Linking } from "react-native";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import { WidgetView } from "../components/WidgetView";
import { fetchUserBlocks, getTextFromBlock } from "../lib/notion";
import { getWidgetTheme, saveWidgetTheme } from "../lib/widget-storage";
import { getAuthData } from "../utils/storage";

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  // WidgetTaskHandlerPropsからclickAction renderWidgetを分割代入で取り出す
  //これにより、以降の行では props.renderWidget(...) のように書く代わりに、単に renderWidget(...) と記述できるようになっています
  const { clickAction, renderWidget, widgetAction } = props;

  switch (widgetAction) {
    case "WIDGET_UPDATE":
    case "WIDGET_ADDED":
      await handleRefresh(renderWidget);
      break;

    case "WIDGET_CLICK":
      if (clickAction === "OPEN_MAIN") {
        Linking.openURL("notionmemo://");
      }
      if (clickAction === "OPEN_INPUT") {
        Linking.openURL("notionmemo://quick-input");
      }
      if (clickAction === "TOGGLE_THEME") {
        const currentTheme = await getWidgetTheme();
        const newTheme = currentTheme === "dark" ? "light" : "dark";
        await saveWidgetTheme(newTheme);
        await handleRefresh(renderWidget);
      }
      if (clickAction === "REFRESH") {
        await handleRefresh(renderWidget);
      }
      if (
        clickAction === "OPEN_NOTION" ||
        (clickAction && clickAction.startsWith("OPEN_NOTION:"))
      ) {
        let pageIdStr = "";

        // Extract pageId from clickAction if available
        if (clickAction.startsWith("OPEN_NOTION:")) {
          pageIdStr = clickAction.split(":")[1];
        }

        if (pageIdStr) {
          Linking.openURL(
            `https://www.notion.so/${pageIdStr.replace(/-/g, "")}`,
          );
        } else {
          Linking.openURL("https://www.notion.so/");
        }
      }
      break;
    default:
      break;
  }
}

async function handleRefresh(
  renderWidget: (widget: React.JSX.Element) => Promise<void> | void,
) {
  const theme = await getWidgetTheme();

  // Show loading state or "Loading..." paragraph
  // Note: If we just render loading state, it might flash.
  // Ideally we would show cached data if we had it, but requirements say "without SecureStore".
  // So we show a loading indicator or text.
  await renderWidget(
    <WidgetView title="Loading..." items={[]} isLoading={true} theme={theme} />,
  );

  const userId = await getAuthData();
  if (!userId) {
    await renderWidget(
      <WidgetView title="Notion" items={["Please login"]} theme={theme} />,
    );
    return;
  }

  try {
    const data = await fetchUserBlocks(userId);

    const simpleContent = data.content.map((block: BlockObjectResponse) => ({
      type: block.type,
      text: getTextFromBlock(block),
    }));

    await renderWidget(
      <WidgetView
        title={data.title}
        items={simpleContent}
        pageId={data.pageId}
        theme={theme}
      />,
    );
  } catch (error) {
    // In case of error (e.g. offline), show error message
    // We could potentially show "Offline" or something.
    await renderWidget(
      <WidgetView
        title="Error"
        items={[{ type: "paragraph", text: "Failed to fetch data." }]}
        theme={theme}
      />,
    );
  }
}
