// app/auth-success.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { saveAuthData } from '../utils/storage'; 

//Notionの認証が完了すると、バックエンド（polished-grass-a069）からアプリのこのページ（auth-success）にリダイレクトされ

export default function AuthSuccess() {
  const { user_id } = useLocalSearchParams();
  const router = useRouter();

useEffect(() => {
  async function handleLogin() {

    if (user_id && typeof user_id === "string") {
      await saveAuthData(user_id);       
      router.replace('/');
    } else {
      console.log("2. エラー: user_id が無効です", typeof user_id);
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