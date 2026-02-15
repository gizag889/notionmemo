// app/index.tsx
import { useFocusEffect } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { getAuthData } from "../utils/storage";

interface NotionPage {
  id: string;
  properties: {
    title?: {
      title: { plain_text: string }[];
    };
    [key: string]: any;
  };
}

export default function Home() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // 入力用ステート
  const [memoText, setMemoText] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // ページ一覧取得
  useFocusEffect(
    useCallback(() => {
      async function init() {
        const id = await getAuthData();
        if (id) {
          setUserId(id);
          fetchPages(id);
        }
      }
      init();
    }, []),
  );

  async function fetchPages(id: string) {
    setLoading(true);
    try {
      const res = await fetch(
        `https://polished-grass-a069.gizaguri0426.workers.dev/get-pages?user_id=${id}`,
      );
      const data = await res.json();
      setPages(data.results || []);
      // 最初のページをデフォルトで選択
      if (data.results?.length > 0) setSelectedPageId(data.results[0].id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  // メモ送信処理
  async function handleSendMemo() {
    if (!memoText || !selectedPageId || !userId) {
      Alert.alert("エラー", "メモを入力し、ページを選択してください");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch(
        "https://polished-grass-a069.gizaguri0426.workers.dev/add-memo",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            page_id: selectedPageId,
            content: memoText,
          }),
        },
      );

      if (res.ok) {
        Alert.alert("成功", "Notionにメモを追記しました！");
        setMemoText(""); // 入力欄をクリア
      } else {
        throw new Error("送信失敗");
      }
    } catch (e) {
      Alert.alert("エラー", "送信に失敗しました");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notion Quick Memo</Text>

      {/* 入力エリア */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="メモを入力..."
          placeholderTextColor="#888"
          value={memoText}
          onChangeText={setMemoText}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, isSending && { opacity: 0.5 }]}
          onPress={handleSendMemo}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>送信</Text>
          )}
        </TouchableOpacity>
      </View>

      <Text style={styles.subTitle}>送信先ページを選択:</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#FFEE58" />
      ) : (
        <FlatList
          data={pages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.pageItem,
                selectedPageId === item.id && styles.selectedPage,
              ]}
              onPress={() => setSelectedPageId(item.id)}
            >
              <Text
                style={[
                  styles.pageText,
                  selectedPageId === item.id && styles.selectedPageText,
                ]}
              >
                {item.properties?.title?.title[0]?.plain_text || "無題のページ"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
    paddingTop: 60,
  },
  title: {
    color: "#FFEE58",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 20,
  },
  subTitle: { color: "#fff", fontSize: 16, marginTop: 20, marginBottom: 10 },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    padding: 15,
    borderRadius: 10,
    fontSize: 16,
    minHeight: 80,
  },
  sendButton: {
    backgroundColor: "#FFEE58",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    height: 55,
    justifyContent: "center",
  },
  sendButtonText: { fontWeight: "bold", fontSize: 16 },
  pageItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  selectedPage: { backgroundColor: "#333", borderRadius: 10 },
  pageText: { color: "#aaa" },
  selectedPageText: { color: "#FFEE58", fontWeight: "bold" },
});
