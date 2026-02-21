import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useRef } from "react";
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
import { GestureDetector } from "react-native-gesture-handler";
import Animated from "react-native-reanimated";
import { SvgWidget } from "../components/SvgWidget";
import { useDraggable } from "../hooks/useDraggable";
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
const REFRESH_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-rotate-ccw"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
`;
const PENCIL_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#E6E6E6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pen"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
`;
const UNPLUG_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-unplug-icon lucide-unplug"><path d="m19 5 3-3"/><path d="m2 22 3-3"/><path d="M6.3 20.3a2.4 2.4 0 0 0 3.4 0L12 18l-6-6-2.3 2.3a2.4 2.4 0 0 0 0 3.4Z"/><path d="M7.5 13.5 10 11"/><path d="M10.5 16.5 13 14"/><path d="m12 6 6 6 2.3-2.3a2.4 2.4 0 0 0 0-3.4l-2.6-2.6a2.4 2.4 0 0 0-3.4 0Z"/></svg>
`;
const TRASH_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-trash2-icon lucide-trash-2"><path d="M10 11v6"/><path d="M14 11v6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
`;

const LINK_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
`;

export default function Home() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  // Floating controller state
  const { pan, animatedStyle } = useDraggable();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notionBlocks"],
    queryFn: async () => {
      const userId = await getAuthData();
      if (!userId) {
        return null;
      }
      return fetchUserBlocks(userId);
    },
  });

  const handleCopy = async () => {
    if (data && data.content.length > 0) {
      const text = data.content
        .map((block) => getTextFromBlock(block))
        .join("\n");
      // @ts-ignore
      await Clipboard.setStringAsync(text);
      Alert.alert("コピーしました", "クリップボードに保存しました。");
    }
  };

  const handleNotionAuth = () => {


    const authUrl = process.env.EXPO_PUBLIC_AUTH_URL;

    if (!authUrl) {
      Alert.alert("Error", "AUTH_URL is missing");
      return;
    }

    Linking.openURL(authUrl);
  };

  if (isLoading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // User is not logged in
  if (!data) {
    return (
      <View>
        <View
          style={{
            paddingTop: 100,
            flex: 1,
            backgroundColor: "#121212",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Button
            title="Notionと連携する"
            onPress={handleNotionAuth}
            color="#222222"
          />
        </View>
        <View>
          <Button title="更新" onPress={() => refetch()} color="#222222" />
        </View>
      </View>
    );
  }

  const { title: pageTitle, content: blocks, pageId } = data;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        <View style={{ padding: 20, paddingBottom: 100 }}>
          <View style={{}}>
            <TouchableOpacity
              onPress={handleNotionAuth}
              style={[styles.actionButton, { backgroundColor: "#1E88E5" }]}
            >
              <SvgWidget
                svg={LINK_ICON_SVG}
                width={24}
                height={24}
                color="#fff"
              />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                await deleteAuthData();
                const val = await getAuthData();
                alert("リセット結果 (nullなら成功): " + val);
                // Invalidate query to update UI logic (show login button)
                queryClient.invalidateQueries({ queryKey: ["notionBlocks"] });
              }}
              style={[styles.actionButton, { backgroundColor: "#D32F2F" }]}
            >
              <SvgWidget
                svg={UNPLUG_ICON_SVG}
                width={24}
                height={24}
                color="#fff"
              />
            </TouchableOpacity>
          </View>

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
        {/* Scroll To Top */}
        <View style={styles.scrollTopButton}>
          <TouchableOpacity
            style={{
              height: 60,
              width: 60,
              justifyContent: "center",
              alignItems: "center",
            }}
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
        </View>
      </ScrollView>

      <Animated.View style={[styles.fabContainer, animatedStyle]}>
        {/* Copy Button */}
        <TouchableOpacity style={styles.controlButton} onPress={handleCopy}>
          <SvgWidget svg={COPY_ICON_SVG} width={30} height={30} color="#fff" />
        </TouchableOpacity>

        {/* Quick Input */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => router.push("/quick-input")}
        >
          <SvgWidget
            svg={PENCIL_ICON_SVG}
            style={{
              height: 28,
              width: 28,
            }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => refetch()}
        >
          <SvgWidget
            svg={REFRESH_ICON_SVG}
            width={24}
            height={24}
            color="#fff"
          />
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
  scrollTopButton: {
    backgroundColor: "#000",
    height: 60,
    width: 60,
    borderRadius: 30,
    elevation: 5,
    alignSelf: "center",
    marginBottom: 50,
  },
  actionButton: {
    backgroundColor: "#333",
    width: 50,
    height: 50,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  linkButtonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end", // Changed to flex-end or center depending on preference, but maybe space-between if we want them apart. Let's stick to the plan.
    // actually original plan was space-between, but maybe we want them next to each other or something.
    // Let's put them on top.
    marginBottom: 10,
    gap: 10,
  },
});
