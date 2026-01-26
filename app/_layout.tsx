import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Notion Viewer' }} />
      <Stack.Screen 
        name="quick-input" 
        options={{ 
          presentation: 'modal', // 下からニョキッと出る設定
          title: 'クイック追加' 
        }} 
      />
    </Stack>
  );
}