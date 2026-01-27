import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";

const queryClient = new QueryClient();

export default function Layout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Notion Viewer" }} />
        <Stack.Screen
          name="quick-input"
          options={{
            presentation: "modal", // 下からニョキッと出る設定
            title: "クイック追加",
          }}
        />
      </Stack>
    </QueryClientProvider>
  );
}
