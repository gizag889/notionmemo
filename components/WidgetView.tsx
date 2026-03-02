"use no memo";

import {
  FlexWidget,
  ListWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";

export interface WidgetViewItem {
  type: string;
  text: string;
  richText?: any[];
}

export interface WidgetViewProps {
  items?: (string | WidgetViewItem)[];
  title?: string;
  pageId?: string;
  isLoading?: boolean;
  theme?: "light" | "dark";
}

const THEME_COLORS = {
  light: {
    background: "#FFFFFF",
    textPrimary: "#37352f",
    textSecondary: "rgba(55, 53, 47, 0.65)",
    icon: "#37352f",
    border: "#e0e0e0",
  },
  dark: {
    background: "#191919",
    textPrimary: "#d4d4d4",
    textSecondary: "rgba(255, 255, 255, 0.44)",
    icon: "#d4d4d4",
    border: "#2f2f2f",
  },
} as const;

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

const getRefreshIconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
`;

const getPencilIconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
`;

const getHeaderIconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
`;

const getMoonIconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-moon-icon lucide-moon"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>
`;

const getSunIconSvg = (color: string) => `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sun-icon lucide-sun"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;

export function WidgetView({
  items = [{ type: "paragraph", text: "読み込み中..." , richText: []}],
  title = "📌 Notion最新",
  pageId,
  isLoading = false,
  theme = "dark",
}: WidgetViewProps) {
  const colors = THEME_COLORS[theme];

  // Helper to normalize items to structured format for backward compatibility
  const normalizedItems: WidgetViewItem[] = Array.isArray(items)
    ? items.map((item) => {
        if (typeof item === "string") {
          return { type: "paragraph", text: item , richText: []};
        }
        if (!item) {
          return { type: "paragraph", text: "" , richText: []};
        }
        return {
          type: item.type || "paragraph",
          text: item.text || "",
          richText: item.richText,
        };
      })
    : [];

  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: colors.background,
        borderRadius: 16,
      }}
    >
      <FlexWidget
        style={{
          flex: 1,
          width: "match_parent",
          marginBottom: 12,
          paddingHorizontal: 12,
          paddingTop: 12,
        }}
      >
        <ListWidget
          style={{
            height: "match_parent",
            width: "match_parent",
            backgroundColor: colors.background,
          }}
        >
          <FlexWidget
            clickAction={pageId ? `OPEN_NOTION:${pageId}` : "OPEN_NOTION"}
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginLeft: 12,
              marginTop: 12,
              marginBottom: 4,
            }}
          >
            <TextWidget
              text={title}
              style={{
                color: colors.textSecondary,
                fontSize: 16,
                fontWeight: "bold",
              }}
            />
            <SvgWidget
              svg={getHeaderIconSvg(colors.textSecondary)}
              style={{
                height: 12,
                width: 12,
                marginRight: 4,
              }}
            />
          </FlexWidget>
          {(() => {
            let currentNumber = 1;
            return normalizedItems.map((item, index) => {
              const isBulletedList = item.type === "bulleted_list_item";
              const isNumberedList = item.type === "numbered_list_item";

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

              const isHeading = item.type.startsWith("heading");
              const fontSize =
                item.type === "heading_1"
                  ? 20
                  : item.type === "heading_2"
                    ? 18
                    : item.type === "heading_3"
                      ? 16
                      : 14;
              const fontWeight = isHeading ? "bold" : "normal";
              const marginLeft = isBulletedList || isNumberedList ? 24 : 12;
              const marginBottom = isHeading ? 6 : 12;
              const marginTop = isHeading ? 12 : 0;

              // Fallback to old simple string approach if no rich text found
              if (!item.richText || item.richText.length === 0) {
                return (
                  <TextWidget
                    key={index}
                    text={`${prefix}${item.text || " "}`}
                    clickAction="OPEN_MAIN"
                    style={{
                      color: colors.textPrimary as any,
                      fontSize,
                      fontWeight,
                      marginLeft,
                      marginRight: 12,
                      marginBottom,
                      marginTop,
                    }}
                  />
                );
              }

              // Rendering styled segments using richText
              return (
                <FlexWidget
                  key={index}
                  clickAction="OPEN_MAIN"
                  style={{
                    flexDirection: "row",
                    marginLeft,
                    marginRight: 12,
                    marginBottom,
                    marginTop,
                  }}
                >
                  <TextWidget
                    text={prefix}
                    style={{
                      color: colors.textPrimary as any,
                      fontSize,
                      fontWeight,
                    }}
                  />
                  {item.richText.map((rt: any, rtIndex: number) => {
                    const plainText = rt.plain_text || "";
                    if (!plainText) return null;

                    let color: string = colors.textPrimary;
                    let isBold = fontWeight === "bold";
                    let isStrikeThrough = false;

                    if (rt.annotations) {
                      if (rt.annotations.bold) isBold = true;
                      if (rt.annotations.strikethrough) isStrikeThrough = true;

                      // For widget, stick to text primary color to avoid clashing,
                      // unless it's a specific notion color. Background colors are hard natively.
                      // Some text styling like textDecorationLine depends on widget text features,
                      // but strikethrough/underline is limited on basic android widget. We'll try at least colors.
                      if (
                        rt.annotations.color &&
                        rt.annotations.color !== "default"
                      ) {
                        const styleColor = rt.annotations.color;
                        if (!styleColor.endsWith("_background")) {
                          color =
                            NOTION_COLORS[styleColor] || colors.textPrimary;
                        }
                      }
                    }

                    return (
                      <TextWidget
                        key={rtIndex}
                        text={plainText}
                        style={{
                          color: color as any,
                          fontSize,
                          fontWeight: isBold ? "bold" : "normal",
                        }}
                      />
                    );
                  })}
                </FlexWidget>
              );
            });
          })()}
        </ListWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          backgroundColor: colors.background,
          marginRight: 20,
          paddingRight: 6,
          paddingBottom: 6,
        }}
      >
        <FlexWidget
          clickAction="TOGGLE_THEME"
          style={{
            justifyContent: "center",
            alignItems: "center",
            paddingRight: 14,
          }}
        >
          <SvgWidget
            svg={
              theme === "dark"
                ? getSunIconSvg(colors.icon)
                : getMoonIconSvg(colors.icon)
            }
            style={{
              height: 28,
              width: 28,
            }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="REFRESH"
          style={{
            justifyContent: "center",
            alignItems: "center",
            // backgroundColor: isLoading ? "#E6F0F5" : undefined,
            borderRadius: 8,
          }}
        >
          <SvgWidget
            svg={getRefreshIconSvg(colors.icon)}
            style={{
              rotation: isLoading ? 180 : 0,
              height: 28,
              width: 28,
            }}
          />
        </FlexWidget>

        <FlexWidget
          clickAction="OPEN_INPUT"
          style={{
            paddingLeft: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SvgWidget
            svg={getPencilIconSvg(colors.icon)}
            style={{
              height: 28,
              width: 28,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
