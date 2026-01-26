import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { WidgetView } from './WidgetView';

// ①ウィジェットの名前 と コンポーネント の紐づけ
const nameToWidget = {
  Hello: WidgetView,
};

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  const widgetInfo = props.widgetInfo;
  const Widget =
    nameToWidget[widgetInfo.widgetName as keyof typeof nameToWidget];

	// ②イベント処理
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
      props.renderWidget(<WidgetView />);
      break;

    case 'WIDGET_UPDATE':
      // Not needed for now
      break;

    case 'WIDGET_RESIZED':
      // Not needed for now
      break;

    case 'WIDGET_DELETED':
      // Not needed for now
      break;

    case 'WIDGET_CLICK':
      // Not needed for now
      break;

    default:
      break;
  }
}