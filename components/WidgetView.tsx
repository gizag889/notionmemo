import { FlexWidget, TextWidget } from 'react-native-android-widget';

export function WidgetView({ content = "読み込み中..." }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: '#1A1A1A',
        borderRadius: 16,
      }}
    >
      {/* 閲覧エリア: タップでメイン画面へ */}
      <FlexWidget
        clickAction="OPEN_MAIN"
        style={{ flex: 1, padding: 12 }}
      >
        <TextWidget text="📌 Notion最新" style={{ color: '#888', fontSize: 10 }} />
        <TextWidget text={content} style={{ color: '#FFF', fontSize: 14 }} />
      </FlexWidget>

      {/* 追加ボタンエリア: タップで入力モーダルへ */}
      <FlexWidget
        clickAction="OPEN_INPUT"
        style={{
          backgroundColor: '#333',
          padding: 10,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
          alignItems: 'center',
        }}
      >
        <TextWidget text="＋ 一行追加" style={{ color: '#FFF', fontWeight: 'bold' }} />
      </FlexWidget>
    </FlexWidget>
  );
}