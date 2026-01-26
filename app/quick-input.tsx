"use no memo";
import { useState } from 'react';
import { View, TextInput, Button, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { WidgetView } from '../components/WidgetView';

export default function QuickInputScreen() {
  const [text, setText] = useState('');
  const router = useRouter();

 const handleSend = async () => {
  if (!text) return;

  try {
    const response = await fetch(`https://api.notion.com/v1/blocks/${process.env.EXPO_PUBLIC_DATABASE_ID}/children`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
        'Content-Type': 'application/json',
        'Notion-Version': '2022-06-28',
      },
      body: JSON.stringify({
        children: [
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [{ text: { content: text } }],
            },
          },
        ],
      }),
    });

    if (response.ok) {

      // 1. AsyncStorageに最新のテキストを保存
      await AsyncStorage.setItem('latest_notion_text', text);

      // 2. ウィジェットの更新をリクエスト
      // これにより、ホーム画面のウィジェットが即座に再描画されます
      requestWidgetUpdate({
        widgetName: 'NotionClipboardWidget',
        renderWidget: () => <WidgetView content={text} />,
      });

      alert('Notionに追加し、ウィジェットを更新しました！');
      router.dismiss(); // モーダルを閉じてメイン画面に戻る
    } else {
      const error = await response.json();
      console.error('Notion Error:', error);
      alert('送信に失敗しました');
    }
  } catch (err) {
    console.error(err);
    alert('通信エラーが発生しました');
  }
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