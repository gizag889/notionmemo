"use no memo";

import {
  FlexWidget,
  ListWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";

export interface WidgetViewProps {
  items?: (string | { type: string; text: string })[];
  title?: string;
  isLoading?: boolean;
}

const REFRESH_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
`;

const PENCIL_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
`;

const HEADER_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9B9B9B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
`;

// const COPY_ICON_SVG = `
// <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
// `;

export function WidgetView({
  items = [{ type: "paragraph", text: "読み込み中..." }],
  title = "📌 Notion最新",
  isLoading = false,
}: WidgetViewProps) {
  // Helper to normalize items to structured format for backward compatibility
  const normalizedItems: { type: string; text: string }[] = Array.isArray(items)
    ? items.map((item) => {
        if (typeof item === "string") {
          return { type: "paragraph", text: item };
        }
        if (!item) {
          return { type: "paragraph", text: "" };
        }
        return {
          type: item.type || "paragraph",
          text: item.text || "",
        };
      })
    : [];


  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#191919",
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
            backgroundColor: "#191919",
          }}
        >
          <FlexWidget
            clickAction="OPEN_NOTION"
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
                color: "#9B9B9B",
                fontSize: 16,
                fontWeight: "bold",
              }}
            />
            <SvgWidget
              svg={HEADER_ICON_SVG}
              style={{
                height: 12,
                width: 12,
                marginRight: 4,
              }}
            />
          </FlexWidget>
          {normalizedItems.map((item, index) => (
            <TextWidget
              key={index}
              text={item.text || " "}
              clickAction="OPEN_MAIN"
              style={{
                color: "#E6E6E6",
                fontSize:
                  item.type === "heading_1"
                    ? 20
                    : item.type === "heading_2"
                      ? 18
                      : item.type === "heading_3"
                        ? 16
                        : 14,
                fontWeight: item.type.startsWith("heading") ? "bold" : "normal",
                marginLeft: 12,
                marginRight: 12,
                marginBottom: item.type.startsWith("heading") ? 6 : 12,
                marginTop: item.type.startsWith("heading") ? 12 : 0,
              }}
            />
          ))}
        </ListWidget>
      </FlexWidget>

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "flex-end",
          alignItems: "center",
          backgroundColor: "#191919",
          marginRight: 20,
          paddingRight: 6,
          paddingBottom: 6,
        }}
      >
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
            svg={REFRESH_ICON_SVG}
            style={{
              rotation: isLoading ? 180 : 0,
              height: 28,
              width: 28,
            }}
          />
        </FlexWidget>
        {/* <FlexWidget
          clickAction="COPY"
          style={{
            paddingLeft: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SvgWidget
            svg={COPY_ICON_SVG}
            style={{
              height: 28,
              width: 28,
            }}
          />
        </FlexWidget> */}
        <FlexWidget
          clickAction="OPEN_INPUT"
          style={{
            paddingLeft: 14,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <SvgWidget
            svg={PENCIL_ICON_SVG}
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
