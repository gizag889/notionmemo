"use no memo";
import type { WidgetTaskHandlerProps } from "react-native-android-widget";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WidgetView } from '../components/WidgetView';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  // WidgetTaskHandlerPropsからclickAction renderWidgetを分割代入で取り出す
  //これにより、以降の行では props.renderWidget(...) のように書く代わりに、単に renderWidget(...) と記述できるようになっています
  const { clickAction, renderWidget, widgetAction } = props;
  // システムからの更新要求やウィジェット表示時に呼ばれる
  if (widgetAction === 'WIDGET_UPDATE' || widgetAction === 'WIDGET_ADDED') {
    // 保存されている最新のテキストを取得
    const savedText = await AsyncStorage.getItem('latest_notion_text');
    
    // ウィジェットを再描画
    renderWidget(<WidgetView content={savedText || 'メモがありません'} />);
  }
  switch (widgetAction) {
    case "WIDGET_UPDATE":
    case "WIDGET_ADDED":

        const savedText = await AsyncStorage.getItem('latest_notion_text');
        renderWidget(<WidgetView content={savedText || 'メモがありません'} />);
        break;
    case "WIDGET_CLICK":
      if (clickAction === "OPEN_MAIN") {
        // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
        // props.clickActionData === { id: 0 }
      }
      if (clickAction === "OPEN_INPUT") {
        // Do stuff when primitive with `clickAction="MY_ACTION"` is clicked
        // props.clickActionData === { id: 0 }
      }
      break;
    default:
      break;
  }
}
