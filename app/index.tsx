"use no memo";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  ActivityIndicator,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SvgWidget } from "../components/SvgWidget";
import { fetchNotionData, getTextFromBlock } from "../lib/notion";
import { updateWidgetContent } from "../lib/widget";

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
`;

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
      <TouchableOpacity
        style={styles.header}
        onPress={() => {
          const pageId = content?.pageId || process.env.EXPO_PUBLIC_BLOCK_ID;
          if (pageId) {
            Linking.openURL(
              `https://www.notion.so/${pageId.replace(/-/g, "")}`,
            );
          }
        }}
      >
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>
            {content?.title || "📌 Notion最新メモ"}
          </Text>
          <SvgWidget
            svg={ICON_SVG}
            width={24}
            height={24}
            style={{ marginRight: 8 }}
          />
        </View>
      </TouchableOpacity>

      <View style={styles.card}>
        {content?.content && Array.isArray(content.content) ? (
          content.content.map((block, index) => {
            return (
              <Text
                key={index}
                style={[
                  styles.paragraph,
                  block.type.startsWith("heading") && { fontWeight: "bold" },
                  block.type === "heading_1" && styles.heading1,
                  block.type === "heading_2" && styles.heading2,
                  block.type === "heading_3" && styles.heading3,
                ]}
              >
                {getTextFromBlock(block)}
              </Text>
            );
          })
        ) : (
          <Text style={styles.paragraph}>{/* Fallback or empty */}</Text>
        )}
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
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: { padding: 20, paddingTop: 40 },
  headerContent: { flexDirection: "row", alignItems: "center" },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#37352F",
    textDecorationLine: "underline",
  },
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
  heading1: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 16,
    marginBottom: 8,
  },
  heading2: {
    fontSize: 24,
    lineHeight: 28,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 12,
    marginBottom: 6,
  },
  heading3: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "bold",
    color: "#37352F",
    marginTop: 8,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: "#37352F",
    marginBottom: 6,
  },
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
