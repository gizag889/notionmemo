import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
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

const HelpSection = () => (
  <View style={styles.helpContainer}>
    <View style={styles.helpContent}>
      <Text style={styles.helpTitle}>ヘルプ</Text>
      <Text style={styles.helpText}>
        ここにヘルプ内容が表示されます。アプリの使い方や注意事項などを記載してください。
      </Text>
    </View>
  </View>
);

const queryClient = new QueryClient();

export default function Layout() {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1 }}>
        <Stack>
          <Stack.Screen
            name="index"
            options={{
              title: "Notion Viewer",
              headerRight: () => (
                <TouchableOpacity
                //setIsHelpOpen((prev) => !prev) は、「今の値（prev）を反対（!）にしてください」 という命令
                  onPress={() => setIsHelpOpen((prev) => !prev)}
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
              presentation: "modal", // 下からニョキッと出る設定
              title: "クイック追加",
            }}
          />
        </Stack>
        {isHelpOpen && <HelpSection />}
      </View>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  helpContainer: {
    position: "absolute",
    top: 100, // ヘッダーの下あたり
    right: 20,
    left: 20,
    backgroundColor: "white",
    borderRadius: 8,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 1000,
  },
  helpContent: {
    gap: 8,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 4,
  },
  helpText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
  },
});
