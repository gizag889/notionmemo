import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, router } from "expo-router";
import { StyleSheet, TouchableOpacity } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { Circle, Path, Svg } from "react-native-svg";

const HelpIcon = () => (
  <Svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    color="#000"
  >
    <Circle cx="12" cy="12" r="10" />
    <Path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <Path d="M12 17h.01" />
  </Svg>
);

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Notion Viewer",
              headerRight: () => (
                <TouchableOpacity
                  onPress={() => router.push("/help")}
                  style={{ marginRight: 15 }}
                >
                  <HelpIcon />
                </TouchableOpacity>
              ),
            }}
          />
          <Stack.Screen
            name="quick-input"
            options={{
              presentation: "modal",
              title: "クイック追加",
            }}
          />
          <Stack.Screen
            name="help"
            options={{
              title: "ヘルプ",
            }}
          />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({});
