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
  scheme: "viewer-memo",
  name: "Viewer Memo for Notion",
  slug: "notionmemo",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  userInterfaceStyle: "automatic",
  android: {
    package: "com.gizag.notionmemo",
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false,
    intentFilters: [
      {
        action: "VIEW",
        data: {
          scheme: "viewer-memo",
        },
        category: ["BROWSABLE", "DEFAULT"],
      },
      {
        action: "VIEW",
        data: {
          scheme: "https",
          host: "viewer-memo.gizaguri0426.workers.dev",
          pathPrefix: "/auth-success",
        },
        category: ["BROWSABLE", "DEFAULT"],
        autoVerify: true,
      },
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/images/adaptive-icon.png",
      backgroundColor: "#FFFFFF",
    },
  },
  web: {
    output: "static",
    favicon: "./assets/images/favicon.png",
  },
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    eas: {
      projectId: "549c2150-1af5-4083-b189-1f151b461f72",
      
    },
  },
  owner: "gizag889",
  plugins: [
    "expo-dev-client",
    [
      "react-native-google-mobile-ads",
      {
        androidAppId: "ca-app-pub-8138082752217427~1380831209",
      },
    ],
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash.png",
        imageWidth: 230,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "gizag889",
        organization: "gizag889",
      },
    ],
    ["react-native-android-widget", widgetConfig],
  ],
});
