"use no memo";

import {
  FlexWidget,
  ListWidget,
  SvgWidget,
  TextWidget,
} from "react-native-android-widget";

export interface WidgetViewProps {
  items?: string[];
  title?: string;
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

export function WidgetView({
  items = ["読み込み中..."],
  title = "📌 Notion最新",
}: WidgetViewProps) {
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
        <ListWidget style={{ height: "match_parent", width: "match_parent" }}>
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
                fontSize: 14,
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
          {items.map((item, index) => (
            <TextWidget
              key={index}
              text={item}
              clickAction="OPEN_MAIN"
              style={{
                color: "#E6E6E6",
                fontSize: 14,
                marginLeft: 12,
                marginRight: 12,
                marginBottom: 12,
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
          }}
        >
          <SvgWidget
            svg={REFRESH_ICON_SVG}
            style={{
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
