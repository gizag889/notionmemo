import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export default function App() {
  const url = Linking.useURL(); // アプリが受け取ったURLをリアルタイムで取得
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    if (url) {
      // url = "myapp://auth-success?user_id=xxxxx"
      const { hostname, path, queryParams } = Linking.parse(url);
      
      console.log(`Linked to: ${hostname}${path} with params:`, queryParams);

      if (path === 'auth-success' && queryParams.user_id) {
        setUserId(queryParams.user_id);
        // ここでSecureStoreなどにuser_idを保存するロジックを入れる
        alert(`ログイン成功！ User ID: ${queryParams.user_id}`);

        
      }
    }
  }, [url]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{userId ? `Logged in as: ${userId}` : "Not logged in"}</Text>
    </View>
  );
}