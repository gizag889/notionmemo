import { BlockObjectResponse } from "@notionhq/client/build/src/api-endpoints";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Linking,
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
import { fetchUserBlocks, getTextFromBlock } from "../lib/notion";
import { deleteAuthData, getAuthData } from "../utils/storage";

const DRAG_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-grip-icon lucide-grip"><circle cx="12" cy="5" r="1"/><circle cx="19" cy="5" r="1"/><circle cx="5" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/><circle cx="12" cy="19" r="1"/><circle cx="19" cy="19" r="1"/><circle cx="5" cy="19" r="1"/></svg>
`;
const SCROLL_UP_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up"><path d="m5 12 7-7 7 7"/><path d="M12 19V5"/></svg>
`;

const COPY_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-copy-icon lucide-copy"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
`;

export default function Home() {
  const router = useRouter();
  const [blocks, setBlocks] = useState<BlockObjectResponse[]>([]);
  const [pageTitle, setPageTitle] = useState<string>("私のNotionページ");
  const [pageId, setPageId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Floating controller state
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

  const fetchBlocks = async () => {
    setLoading(true);
    const userId = await getAuthData();
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { title, content, pageId } = await fetchUserBlocks(userId);
      setBlocks(content);
      setPageTitle(title);
      setPageId(pageId);
    } catch (error) {
      console.error("Fetch Error:", error);
      alert("通信エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (blocks.length > 0) {
      const text = blocks.map((block) => getTextFromBlock(block)).join("\n");
      // @ts-ignore
      await Clipboard.setStringAsync(text);
      Alert.alert("コピーしました", "クリップボードに保存しました。");
    }
  };

  useEffect(() => {
    fetchBlocks();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View style={{ padding: 20, paddingBottom: 150 }}>
          <Button
            title="リセット（削除テスト）"
            color="#D32F2F"
            onPress={async () => {
              await deleteAuthData();
              const val = await getAuthData();
              alert("リセット結果 (nullなら成功): " + val);
            }}
          />

          <TouchableOpacity
            onPress={() => {
              if (pageId) {
                Linking.openURL(
                  `https://www.notion.so/${pageId.replace(/-/g, "")}`,
                );
              }
            }}
          >
            <Text style={styles.title}>{pageTitle}</Text>
          </TouchableOpacity>
          <Button title="更新" onPress={fetchBlocks} />

          <View style={styles.card}>
            {blocks.length > 0 ? (
              blocks.map((block, index) => {
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
              <Text style={styles.paragraph}>No content found</Text>
            )}
          </View>
        </View>
      </ScrollView>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 24, marginBottom: 20, marginTop: 20 },
  card: {
    marginTop: 20,
    padding: 20,
    backgroundColor: "#fff",
    borderRadius: 12,
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
    bottom: 50,
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
