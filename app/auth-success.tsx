// app/auth-success.tsx
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View, ActivityIndicator } from 'react-native';

export default function AuthSuccess() {
  const { user_id } = useLocalSearchParams(); // URLの ?user_id=xxx を取得
  const router = useRouter();

  useEffect(() => {
    if (user_id) {
      console.log("取得したUser ID:", user_id);
      
      // ここで本来は：
      // 1. SecureStore などに user_id を保存
      // 2. 数秒後にホーム画面（/）へ自動移動させる、などの処理を行う
      
      // テスト用に3秒後にトップへ戻る例：
      setTimeout(() => {
        router.replace('/'); 
      }, 3000);
    }
  }, [user_id]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#121212' }}>
      <ActivityIndicator size="large" color="#FFEE58" />
      <Text style={{ color: 'white', marginTop: 20 }}>
        ログインに成功しました！
      </Text>
      <Text style={{ color: '#aaa', fontSize: 12 }}>
        User ID: {user_id}
      </Text>
      <Text style={{ color: '#aaa', fontSize: 12, marginTop: 10 }}>
        まもなくホームへ戻ります...
      </Text>
    </View>
  );
}