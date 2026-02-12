// app/auth-success.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { saveAuthData } from '../utils/storage'; // 先ほど作った関数

export default function AuthSuccess() {
  const { user_id } = useLocalSearchParams();
  const router = useRouter();

  useEffect(() => {
    async function handleLogin() {
      if (user_id && typeof user_id === 'string') {
        // --- ここで金庫に保存！ ---
        await saveAuthData(user_id);
        console.log("SecureStoreに保存完了:", user_id);

        // 保存できたことを確認してホーム画面へ
        setTimeout(() => {
          router.replace('/'); 
        }, 1500);
      }
    }
    handleLogin();
  }, [user_id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#FFEE58" />
      <Text style={{ color: 'white', marginTop: 20, fontSize: 18, fontWeight: 'bold' }}>
        認証を完了しています...
      </Text>
    </View>
  );
}