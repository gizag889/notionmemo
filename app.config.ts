import type { ConfigContext, ExpoConfig } from "expo/config";
import type { WithAndroidWidgetsParams } from "react-native-android-widget";

const widgetConfig: WithAndroidWidgetsParams = {
  // 【任意】カスタムフォントのパス（アイコンウィジェットを使う場合に必要）
  // fonts: ['./assets/fonts/Inter.ttf'],
  widgets: [
    {
      name: "Hello", // ウィジェットの名前（タスクハンドラーに書いたウィジェット名に合わせる）
      label: "My Hello Widget", // ウィジェットピッカーに表示されるラベル
      minWidth: "320dp",
      minHeight: "120dp",
      // これは、ウィジェットのデフォルトのサイズがtargetCellWidthとtargetCellHeight属性で指定された5x2セルであることを意味します。
      // または、Android 11以下のデバイスではminWidthとminHeightで指定された320×120dpであることを意味します。
      // 定義されている場合、targetCellWidthとtargetCellHeightの属性はminWidthやminHeightの代わりに使用されます。
      targetCellWidth: 5,
      targetCellHeight: 2,
      description: "This is my first widget", // ウィジェットピッカーに表示される説明

      // このAppWidgetが更新される頻度（ミリ秒単位）。
      // タスクハンドラはwidgetAction = 'UPDATE_WIDGET'で呼び出されます。
      // デフォルトは0（自動更新なし）
      // 最小は1800000（30分 == 30 * 60 * 1000）。
      updatePeriodMillis: 1800000,
    },
  ],
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "notionmemo",
  slug: "notionmemo",
  plugins: [["react-native-android-widget", widgetConfig]],
});
