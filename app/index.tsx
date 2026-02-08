"use no memo";
import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { SvgWidget } from "../components/SvgWidget";
import { fetchNotionData, getTextFromBlock } from "../lib/notion";
import { updateWidgetContent } from "../lib/widget";

const ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-square-arrow-out-up-right-icon lucide-square-arrow-out-up-right"><path d="M21 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h6"/><path d="m21 3-9 9"/><path d="M15 3h6v6"/></svg>
`;
const DRAG_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-icon lucide-grip"><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/></svg>
`;
const SCROLL_UP_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
`;

const COPY_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
`;

export default function HomeScreen() {
  //ページ遷移用のrouter
  const router = useRouter();
  //スクロールビューを入れるための「予約席」を作ります
  const scrollViewRef = useRef<ScrollView>(null);

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

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const startX = useSharedValue(0);
  const startY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      startX.value = translateX.value;
      startY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = startX.value + event.translationX;
      translateY.value = startY.value + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
      ],
    };
  });

  const handleCopy = async () => {
    if (content?.content) {
      const text = content.content
        .map((block) => getTextFromBlock(block))
        .join("\n");
      // @ts-ignore
      await Clipboard.setStringAsync(text);
      Alert.alert("コピーしました", "クリップボードに保存しました。");
    }
  };

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
      //画面上のスクロールビューの実体がその予約席にセットされます
      ref={scrollViewRef}
      onContentSizeChange={() => {
        // 初回ロード時やコンテンツ変更時に自動スクロールさせたい場合はここを調整
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }}
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
                selectable={true}
                key={index}
                style={[
                  block.type === "heading_1"
                    ? styles.heading1
                    : block.type === "heading_2"
                      ? styles.heading2
                      : block.type === "heading_3"
                        ? styles.heading3
                        : styles.paragraph,
                ]}
              >
                {getTextFromBlock(block)}
              </Text>
            );
          })
        ) : (
          <Text selectable={true} style={styles.paragraph}>
            {/* Fallback or empty */}
          </Text>
        )}
      </View>

      <Animated.View style={[styles.fabContainer, animatedStyle]}>
        {/* Scroll To Top */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {
            scrollViewRef.current?.scrollTo({ y: 0, animated: true });
          }}
        >
          <SvgWidget
            svg={SCROLL_UP_ICON_SVG}
            width={24}
            height={24}
            color="#fff"
          />
        </TouchableOpacity>

        {/* Copy Button */}
        <TouchableOpacity style={styles.controlButton} onPress={handleCopy}>
          <SvgWidget svg={COPY_ICON_SVG} width={24} height={24} color="#fff" />
        </TouchableOpacity>

        {/* Quick Input */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.push("/quick-input")}
        >
          <Text style={styles.fabText}>＋</Text>
        </TouchableOpacity>

        {/* Drag Handle */}
        <GestureDetector gesture={pan}>
          <View
            style={styles.dragHandle}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="ドラッグハンドル"
            accessibilityHint="ドラッグして位置を移動します"
          >
            <SvgWidget
              svg={DRAG_ICON_SVG}
              width={24}
              height={24}
              color="#fff"
            />
          </View>
        </GestureDetector>
      </Animated.View>
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
  fabContainer: {
    position: "absolute",
    right: 20,
    bottom: 120, // レイアウトに合わせて調整
    backgroundColor: "#000",
    width: 60,
    borderRadius: 30,
    alignItems: "center",
    elevation: 5,
    paddingVertical: 12,
    gap: 12,
  },
  controlButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  dragHandle: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  fabText: { color: "#fff", fontSize: 30, lineHeight: 34 },
});
