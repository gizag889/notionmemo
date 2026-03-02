import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useRouter } from "expo-router";
import { useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { ContentView } from "../components/ContentView";
import { FloatingMenu } from "../components/FloatingMenu";
import { SvgWidget } from "../components/SvgWidget";
import { fetchUserBlocks, getTextFromBlock } from "../lib/notion";
import { deleteAuthData, getAuthData } from "../utils/storage";

import {
  LINK_ICON_SVG,
  REFRESH_ICON_SVG,
  SCROLL_UP_ICON_SVG,
  UNPLUG_ICON_SVG,
} from "../constants/icons";

export default function Home() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["notionBlocks"],
    queryFn: async () => {
      const token = await getAuthData();
      if (!token) {
        return null;
      }
      return fetchUserBlocks(token);
    },
  });

  const handleCopy = async () => {
    if (data && data.content.length > 0) {
      let currentNumber = 1;
      const text = data.content
        .map((block) => {
          const isBulletedList = block.type === "bulleted_list_item";
          const isNumberedList = block.type === "numbered_list_item";
          const isChildPage = block.type === "child_page";

          if (isNumberedList) {
            const prefix = `${currentNumber}. `;
            currentNumber++;
            return `${prefix}${getTextFromBlock(block)}`;
          } else {
            currentNumber = 1;
          }

          if (isBulletedList) return `• ${getTextFromBlock(block)}`;
          if (isChildPage) return `📄 ${getTextFromBlock(block)}`;
          return getTextFromBlock(block);
        })
        .join("\n");
      // @ts-ignore
      await Clipboard.setStringAsync(text);
      Alert.alert("コピーしました", "クリップボードに保存しました。");
    }
  };

  const handleNotionAuth = () => {
    Alert.alert(
      "ページ選択について",
      "連携画面でウィジェットやアプリに表示したいNotionページを選択してください。複数選択した場合は、最後に更新されたページが表示されます。\n\n※連携するページを変更する場合は、再度この連携手順を行う必要があります。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "連携画面へ",
          onPress: () => {
            const authUrl =
              "https://polished-grass-a069.gizaguri0426.workers.dev/auth/notion/login";
            Linking.openURL(authUrl);
          },
        },
      ],
    );
  };

  if (isLoading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  // User is not logged in
  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <View style={{ marginTop: 100 }} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.customButton}
            onPress={handleNotionAuth}
          >
            <SvgWidget
              svg={LINK_ICON_SVG}
              width={22}
              height={22}
              color="#fff"
            />
            <Text style={styles.customButtonText}>Notionと連携する</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 20 }} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: "#222222" }]}
            onPress={() => refetch()}
          >
            <SvgWidget
              svg={REFRESH_ICON_SVG}
              width={22}
              height={22}
              color="#fff"
            />
            <Text style={styles.customButtonText}>更新</Text>
          </TouchableOpacity>
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

          <ContentView blocks={blocks} />
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

      <FloatingMenu onCopy={handleCopy} onRefresh={() => refetch()} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212" },
  title: { color: "white", fontSize: 24, marginBottom: 20, marginTop: 20 },
  buttonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  customButton: {
    backgroundColor: "#2986ff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    gap: 8,
  },
  customButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  listItem: {
    marginLeft: 16,
  },

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
