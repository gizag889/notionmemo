"use no memo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Button, StyleSheet, TextInput, View } from "react-native";
import { fetchNotionData, fetchPageTitle } from "../lib/notion";
import { updateWidgetContent } from "../lib/widget";

export default function QuickInputScreen() {
  const [text, setText] = useState("");
  const [buttonTitle, setButtonTitle] = useState("Notion");
  const router = useRouter();

  useEffect(() => {
    fetchPageTitle()
      .then((title) => setButtonTitle(title))
      .catch((err) => console.error("Failed to fetch page title:", err));
  }, []);
  /**
   *
   * @returns
   */
  const handleSend = async () => {
    if (!text) return;

    try {
      const response = await fetch(
        `https://api.notion.com/v1/blocks/${process.env.EXPO_PUBLIC_BLOCK_ID}/children`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
            "Content-Type": "application/json",
            "Notion-Version": "2022-06-28",
          },
          body: JSON.stringify({
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: {
                  rich_text: [{ text: { content: text } }],
                },
              },
            ],
          }),
        },
      );

      if (response.ok) {
        // 1. Notionから最新の全データを再取得
        const newFullText = await fetchNotionData();
        await updateWidgetContent(newFullText);

        alert("Notionに追加し、ウィジェットを更新しました！");
        // 入力画面を閉じてメイン画面に戻る
        router.dismiss();
      } else {
        const error = await response.json();
        console.error("Notion Error:", error);
        alert("送信に失敗しました");
      }
    } catch (err) {
      console.error(err);
      alert("通信エラーが発生しました");
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        autoFocus
        style={styles.input}
        placeholder="ここにメモを入力..."
        placeholderTextColor="#9B9B9B"
        value={text}
        onChangeText={setText}
      />
      <Button title={`${buttonTitle}に追加`} onPress={handleSend} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, justifyContent: "center" },
  input: {
    borderWidth: 1,
    borderColor: "#E9E9E8",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10,
  },
});
