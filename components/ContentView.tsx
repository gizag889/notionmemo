import {
  BlockObjectResponse,
  RichTextItemResponse,
} from "@notionhq/client/build/src/api-endpoints";
import React from "react";
import { Linking, StyleSheet, Text, TextStyle, View } from "react-native";

const NOTION_COLORS: Record<string, string> = {
  gray: "#9B9A97",
  brown: "#64473A",
  orange: "#D9730D",
  yellow: "#DFAB01",
  green: "#0F7B6C",
  blue: "#0B6E99",
  purple: "#6940A5",
  pink: "#AD1A72",
  red: "#E03E3E",
  gray_background: "#EBECED",
  brown_background: "#E9E5E3",
  orange_background: "#FAEBDD",
  yellow_background: "#FBF3DB",
  green_background: "#DDEDEA",
  blue_background: "#DDEBF1",
  purple_background: "#EAE4F2",
  pink_background: "#F4DFEB",
  red_background: "#FBE4E4",
};

export const renderRichText = (
  richTextArray: RichTextItemResponse[] | undefined,
) => {
  if (!richTextArray || richTextArray.length === 0) return null;
  return richTextArray.map((rt, i) => {
    let textStyle: TextStyle = {};
    if (rt.annotations) {
      if (rt.annotations.bold) textStyle.fontWeight = "bold";
      if (rt.annotations.italic) textStyle.fontStyle = "italic";
      if (rt.annotations.strikethrough)
        textStyle.textDecorationLine = "line-through";
      if (rt.annotations.underline) textStyle.textDecorationLine = "underline";
      if (rt.annotations.code) {
        textStyle.fontFamily = "monospace";
        textStyle.backgroundColor = "rgba(135,131,120,0.15)";
        textStyle.color = "#EB5757";
      }
      if (rt.annotations.color && rt.annotations.color !== "default") {
        const color = rt.annotations.color;
        if (color.endsWith("_background")) {
          textStyle.backgroundColor = NOTION_COLORS[color] || undefined;
        } else {
          textStyle.color = NOTION_COLORS[color] || undefined;
        }
      }
    }

    // Filter out undefined styles to avoid RN warnings
    const finalStyle = Object.fromEntries(
      Object.entries(textStyle).filter(([_, v]) => v !== undefined),
    );

    return (
      <Text key={i} style={finalStyle}>
        {rt.plain_text}
      </Text>
    );
  });
};

export function ContentView({ blocks }: { blocks: BlockObjectResponse[] }) {
  if (!blocks || blocks.length === 0) {
    return (
      <View style={styles.card}>
        <Text style={styles.paragraph}>No content found</Text>
      </View>
    );
  }

  let currentNumber = 1;

  return (
    <View style={styles.card}>
      {blocks.map((block, index) => {
        const isBulletedList = block.type === "bulleted_list_item";
        const isNumberedList = block.type === "numbered_list_item";
        const isChildPage = block.type === "child_page";

        let prefix = "";
        if (isNumberedList) {
          prefix = `${currentNumber}. `;
          currentNumber++;
        } else {
          currentNumber = 1;
        }

        if (isBulletedList) {
          prefix = "• ";
        }
        if (isChildPage) {
          prefix = "📄 ";
        }

        const richText = (block as any)[block.type]?.rich_text;

        return (
          <Text
            selectable={true}
            key={index}
            style={[
              block.type === "heading_1"
                ? styles.heading1
                : block.type === "heading_2"
                  ? styles.heading2
                  : block.type === "heading_3"
                    ? styles.heading3
                    : styles.paragraph,
              (isBulletedList || isNumberedList) && styles.listItem,
              isChildPage && {
                fontWeight: "bold",
                textDecorationLine: "underline",
              },
            ]}
            onPress={
              isChildPage
                ? () =>
                    Linking.openURL(
                      `https://www.notion.so/${block.id.replace(/-/g, "")}`,
                    )
                : undefined
            }
          >
            {prefix}
            {isChildPage
              ? (block as any).child_page.title
              : renderRichText(richText)}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  heading1: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#37352F",
    marginBottom: 6,
  },
  listItem: {
    marginLeft: 16,
  },
});
