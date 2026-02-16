// app/index.tsx
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
import { resolveUserPage } from "../lib/notion";
import { getAuthData } from "../utils/storage";



export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [pageTitle, setPageTitle] = useState<string>("");

  // 入力用ステート
  const [memoText, setMemoText] = useState("");
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // ページ情報取得
  React.useEffect(() => {
    async function init() {
      const id = await getAuthData();
      if (id) {
        setUserId(id);
        const { title, pageId } = await resolveUserPage(id);
        setPageTitle(title);
        setSelectedPageId(pageId);
      }
    }
    init();
  }, []);

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
      </View>
      <View>
        <TouchableOpacity
          style={[styles.sendButton, isSending && { opacity: 0.5 }]}
          onPress={handleSendMemo}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.sendButtonText}>
              {pageTitle || "読み込み中..."}に送信
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    backgroundColor: "#FFFFFF",
    padding: 15,
    borderRadius: 10,
    marginLeft: 10,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonText: { fontWeight: "bold", fontSize: 16 },
  pageItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#333" },
  selectedPage: { backgroundColor: "#333", borderRadius: 10 },
  pageText: { color: "#aaa" },
  selectedPageText: { color: "#FFEE58", fontWeight: "bold" },
});
