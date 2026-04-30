import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useContext, useRef } from "react";
import { PortalContext } from "./_layout";
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
import { PrivacyModal } from "../components/PrivacyModal";
import { SvgWidget } from "../components/SvgWidget";
import { TermsModal } from "../components/TermsModal";
import { fetchUserBlocks, getTextFromBlock } from "../lib/notion";
import { deleteAuthData, getAuthData } from "../utils/storage";

import {
  LINK_ICON_SVG,
  REFRESH_ICON_SVG,
  SCROLL_UP_ICON_SVG,
  UNPLUG_ICON_SVG,
} from "../constants/icons";

import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";
interface Props {
  size: BannerAdSize;
}



export default function Home() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const queryClient = useQueryClient();
  const { setPortal } = useContext(PortalContext);

    const unitId = TestIds.BANNER;


  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ["notionBlocks"],
    queryFn: async () => {
      const token = await getAuthData();
      if (!token) {
        return null;
      }
      return fetchUserBlocks(token, true); // forceRefresh = true for the main app
    },
  });

  const handleCopy = useCallback(async () => {
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
  }, [data]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  useFocusEffect(
    useCallback(() => {
      if (data) {
        setPortal(
          <FloatingMenu onCopy={handleCopy} onRefresh={handleRefresh} />,
        );
      } else {
        setPortal(null);
      }
      return () => setPortal(null);
    }, [data, handleCopy, handleRefresh, setPortal]),
  );

  const handleNotionAuth = () => {
    Alert.alert(
      "ページ選択について",
      "連携画面でウィジェットやアプリに表示したいNotionページを選択してください。複数選択した場合は、最後に更新されたページが表示されます。\n\n※このアプリでは複数のページを表示することはできません。",
      [
        {
          text: "キャンセル",
          style: "cancel",
        },
        {
          text: "連携画面へ",
          onPress: () => {
            const loginUrl =
              "https://viewer-memo.gizaguri0426.workers.dev/auth/notion/login";
            Linking.openURL(loginUrl);
          },
        },
      ],
    );
  };

  if (isLoading || (isFetching && !data)) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#121212",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <PrivacyModal />
        <TermsModal />
        <ActivityIndicator size="large" color="#FFEE58" />
        <Text
          style={{
            color: "white",
            marginTop: 20,
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          読み込み中...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212", justifyContent: "center", alignItems: "center", padding: 20 }}>
        <PrivacyModal />
        <TermsModal />
        <Text style={{ color: "#ef5350", fontSize: 18, fontWeight: "bold", marginBottom: 10, textAlign: "center" }}>
          データの取得に失敗しました
        </Text>
        <Text style={{ color: "#aaa", fontSize: 14, marginBottom: 30, textAlign: "center", lineHeight: 22 }}>
          通信エラーが発生しました。{"\n"}ネットワーク環境を確認して再試行してください。
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.customButton}
            onPress={() => refetch()}
          >
            <SvgWidget
              svg={REFRESH_ICON_SVG}
              width={22}
              height={22}
              color="#fff"
            />
            <Text style={styles.customButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
        <View style={{ marginTop: 20 }} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.customButton, { backgroundColor: "#D32F2F" }]}
            onPress={async () => {
              await deleteAuthData();
              queryClient.invalidateQueries({ queryKey: ["notionBlocks"] });
            }}
          >
            <SvgWidget
              svg={UNPLUG_ICON_SVG}
              width={22}
              height={22}
              color="#fff"
            />
            <Text style={styles.customButtonText}>連携を解除する</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // User is not logged in
  if (data === null) {
    return (
      <View style={{ flex: 1, backgroundColor: "#121212" }}>
        <PrivacyModal />
        <TermsModal />
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

  if (!data) return null; // Type narrowing fallback
  
  const { title: pageTitle, content: blocks, pageId } = data;

  return (
    <View style={{ flex: 1 }}>
      <PrivacyModal />
      <TermsModal />
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
                alert("ページ連携を解除しました。");
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
         <BannerAd
      size={BannerAdSize.BANNER}
      unitId={unitId}
    />
      </ScrollView>

      {isFetching && data && (
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: "rgba(18, 18, 18, 0.7)",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 10,
          }}
        >
          <ActivityIndicator size="large" color="#FFEE58" />
          <Text
            style={{
              color: "white",
              marginTop: 16,
              fontSize: 16,
              fontWeight: "bold",
            }}
          >
            更新中...
          </Text>
        </View>
      )}
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
