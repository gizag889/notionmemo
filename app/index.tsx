"use no memo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { fetchNotionData } from "../lib/notion";
import { updateWidgetContent } from "../lib/widget";

export default function HomeScreen() {
  //ページ遷移用のrouter
  const router = useRouter();

  const {
    //楽観的観測 pending
    data: content,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["notionData"],
    queryFn: fetchNotionData,
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (content) {
      updateWidgetContent(content);
    }
  }, [content]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.center}>
        <Text>データの取得に失敗しました。</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        //Pull to Refresh モバイルのプラクティス
        <RefreshControl
          // 今くるくる回すべきか
          refreshing={isRefetching}
          //画面引っ張ったらアクション
          onRefresh={refetch}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📌 Notion最新メモ</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.contentText}>
          {Array.isArray(content) ? content.join("\n") : content}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/quick-input")}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8f9fa" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: "bold", color: "#333" },
  card: {
    margin: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 3, // Androidの影
    shadowColor: "#000", // iOSの影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentText: { fontSize: 16, lineHeight: 24, color: "#444" },
  fab: {
    position: "absolute",
    right: 20,
    top: 500, // レイアウトに合わせて調整
    backgroundColor: "#000",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  fabText: { color: "#fff", fontSize: 30, marginBottom: 4 },
});
