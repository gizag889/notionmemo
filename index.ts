import "@expo/metro-runtime";
import { App } from "expo-router/build/qualified-entry";
import { registerRootComponent } from "expo";
import { registerWidgetTaskHandler } from "react-native-android-widget";
import { widgetTaskHandler } from "./components/widget-task-handler";

registerRootComponent(App);
registerWidgetTaskHandler(widgetTaskHandler);
