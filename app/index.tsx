import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function App() {
  const [memo, setMemo] = useState("");
  const [loading, setLoading] = useState(false);

  const postToNotion = async () => {
    if (!memo) return Alert.alert("エラー", "メモを入力してください");

  

    setLoading(true);

    try {
      const response = await fetch("https://api.notion.com/v1/pages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
          "Content-Type": "application/json",
          "Notion-Version": "2022-06-28",
        },
        body: JSON.stringify({
          parent: { database_id: process.env.EXPO_PUBLIC_DATABASE_ID },
          properties: {
            // "名前"（Title型）のプロパティ名は、作成したDBのタイトル列名に合わせてください
            名前: {
              title: [{ text: { content: memo } }],
            },
          },
        }),
      });

      if (response.ok) {
        Alert.alert("成功", "Notionに保存しました！");
        setMemo("");
      } else {
        const errorData = await response.json();
        console.error(errorData);
        Alert.alert("失敗", "保存に失敗しました");
      }
    } catch (error) {
      console.error(error);
      Alert.alert("エラー", "通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notion Quick Memo</Text>
      <TextInput
        style={styles.input}
        placeholder="メモを入力..."
        value={memo}
        onChangeText={setMemo}
      />
      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={postToNotion}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Notionへ送信</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#007AFF",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
