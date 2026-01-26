"use no memo";
import { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function QuickInputScreen() {
  const [text, setText] = useState('');
  const router = useRouter();

  const handleSend = async () => {
    // ここでブロック方式のAPIを叩く
    // PATCH https://api.notion.com/v1/blocks/{PAGE_ID}/children
    // ...送信処理...
    router.dismiss(); // 画面を閉じる
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoFocus
        style={styles.input}
        placeholder="ここにメモを入力..."
        value={text}
        onChangeText={setText}
      />
      <Button title="Notionに追加" onPress={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 15, marginBottom: 20, borderRadius: 10 }
});