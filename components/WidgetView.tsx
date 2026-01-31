"use no memo";

import { FlexWidget, TextWidget } from "react-native-android-widget";

export function WidgetView({ content = "読み込み中..." }) {
  return (
    <FlexWidget
      style={{
        height: "match_parent",
        width: "match_parent",
        backgroundColor: "#191919",
        borderRadius: 16,
      }}
    >
      {/* 閲覧エリア: タップでメイン画面へ */}

      <FlexWidget clickAction="OPEN_MAIN" style={{ flex: 1, padding: 12 }}>
        <TextWidget
          text="📌 Notion最新"
          style={{ color: "#9B9B9B", fontSize: 10 }}
        />
        <TextWidget text={content} style={{ color: "#E6E6E6", fontSize: 14 }} />
      </FlexWidget>

      {/* ここのレイアウトはペンっぽいアイコンでlucid-reactで表現する */}
      {/* 追加ボタンエリア: タップで入力モーダルへ */}

      <FlexWidget
        style={{
          width: "match_parent",
          flexDirection: "row",
          justifyContent: "flex-end",
          padding: 12,
        }}
      >
        <FlexWidget
          clickAction="OPEN_INPUT"
          style={{
            backgroundColor: "#202020",
            borderRadius: 24,
            padding: 12,
          }}
        >
          <TextWidget text="✏️" style={{ fontSize: 18, color: "#E6E6E6" }} />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}
