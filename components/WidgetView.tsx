"use no memo";

import {
  FlexWidget,
  ListWidget,
  OverlapWidget,
  TextWidget,
} from "react-native-android-widget";

export function WidgetView({ items = ["読み込み中..."] }: { items?: string[] }) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#191919",
        borderRadius: 16,
      }}
    >
        <ListWidget style={{ height: "match_parent", width: "match_parent" }}>
          <TextWidget
            text="📌 Notion最新"
            clickAction="OPEN_MAIN"
            style={{
              color: "#9B9B9B",
              fontSize: 10,
              marginBottom: 4,
              marginLeft: 12,
              marginTop: 12,
            }}
          />
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

     
  );
}
