import { useQuery } from "@tanstack/react-query";
import * as Clipboard from "expo-clipboard";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import { useVideoPlayer, VideoView } from "expo-video";
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { SvgWidget } from "../components/SvgWidget";
import {REFRESH_ICON_SVG, UNPLUG_ICON_SVG} from "../constants/icons";
import { PrivacyModal } from "../components/PrivacyModal";
import { TermsModal } from "../components/TermsModal";
import { fetchUserInfo } from "../lib/notion";
import { getAuthData } from "../utils/storage";
import { Background } from "@react-navigation/elements";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function AccordionItem({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded(!expanded);
  };

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        onPress={toggleExpand}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded: expanded }}
        accessibilityLabel={title}
        accessibilityHint="ダブルタップして詳細を展開または折りたたみます"
      >
        <Text style={styles.sectionTitle}>{title}</Text>
        {expanded ? (
          <ChevronUp size={20} color="#333" />
        ) : (
          <ChevronDown size={20} color="#333" />
        )}
      </TouchableOpacity>
      {expanded && <View style={styles.accordionContent}>{children}</View>}
    </View>
  );
}

export default function HelpScreen() {
  const [copied, setCopied] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const videoSource = require("../assets/images/screen.mp4");
  const player = useVideoPlayer(videoSource, (player) => {
    player.loop = true;
    player.muted = true;
    player.play();
  });

  const { data: userInfo, isLoading: isUserInfoLoading } = useQuery({
    queryKey: ["userInfo"],
    queryFn: async () => {
      const token = await getAuthData();
      if (!token) return null;
      return fetchUserInfo(token);
    },
  });

  const handleCopyId = async () => {
    if (userInfo?.app_user_id) {
      await Clipboard.setStringAsync(userInfo.app_user_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "ヘルプ" }} />
      <View style={styles.content}>
        <Text style={styles.title}>Viewer Memo for Notion の使い方</Text>

        <AccordionItem title="Notionのページを連携させる">
          <View>
            <View>
              <Image
                source={require("../assets/images/start.png")}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.text}>
                「Notionと連携する」から、「連携画面へ」を選択します。
              </Text>
            </View>
            <View>
              <Image
                source={require("../assets/images/allowance.png")}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.text}>
                お手持ちのアカウントでログインします。上記の画面に遷移後、許可するアクセス権限を確認して「ページを選択する」に進みます。
              </Text>
            </View>
            <View>
              <Image
                source={require("../assets/images/select.png")}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.text}>
                連携したいページを一つ選択します。
              </Text>
            </View>
            <View>
              <Image
                source={require("../assets/images/success.png")}
                style={styles.image}
                contentFit="contain"
              />
              <Text style={styles.text}>
                以上のような画面が表示されれば連携成功です！
              </Text>
            </View>
          </View>
        </AccordionItem>
        <AccordionItem title="ホーム画面にウィジェットを追加する">
          <View>
            <VideoView
              player={player}
              style={styles.image}
              nativeControls={false}
              contentFit="contain"
            />
            <Text style={styles.text}>
              連携したページの内容が表示されていれば成功です。
              {"\n"}
              ※ブロックの数が50を超えるとそれ以上は表示されません。
            </Text>
          </View>
        </AccordionItem>

        <AccordionItem title="メモを連携したページに追加する">
          <View>
            <Image
              source={require("../assets/images/input.png")}
              style={styles.image}
              contentFit="contain"
            />
            <Text style={styles.text}>
              画面下部やホーム画面のウィジェットから、素早くNotionにメモを追加できます。
            </Text>
          </View>
        </AccordionItem>
        <AccordionItem title="その他アイコン説明">
          <View>
            <View style={[styles.actionButton, { backgroundColor: "#2222222" }]}>
             <SvgWidget
                            svg={REFRESH_ICON_SVG}
                            width={24}
                            height={24}
                            color="#fff"
                          />
              </View>
            <Text style={styles.text}>
              ページの内容を更新します。
            </Text>
          </View>
           <View>
            <View style={[styles.actionButton, { backgroundColor: "#D32F2F" }]}>
             <SvgWidget
                            svg={UNPLUG_ICON_SVG}
                            width={24}
                            height={24}
                            color="#fff"
                          />
              </View>
            <Text style={styles.text}>
              ページ連携を解除します。
            </Text>
          </View>
          
        </AccordionItem>


        <AccordionItem title="うまく表示されないとき">
          <Text style={styles.strong}>
            ・一部リッチなコンテンツ、トグル、画像、動画などは表示されません。
                                       {"\n"}
            ・連携時に複数のページを選んだ場合、最後に編集されたほうが表示されます。                          
            {"\n"}
            ・連携時、ページ選択画面に進まず、Notionアプリが開いてしまう場合、ブラウザの「閲覧データの削除」をお試しください。
            ※googleアカウントの場合、
            {"\n"}
           ・ブロック数が50を超えるとウィジェットでは、それ以上表示されません。

          </Text>
        </AccordionItem>

        <AccordionItem title="データ削除リクエストについて">
          <View>
            <Text style={styles.text}>
              本アプリ上に保存されているご自身のデータを削除するには、お問い合わせ窓口に以下の「アプリ用ユーザーID」を添えてご連絡ください。
            </Text>

            <View style={styles.idContainer}>
              {isUserInfoLoading ? (
                <ActivityIndicator size="small" color="#555" />
              ) : userInfo?.app_user_id ? (
                <>
                  <Text style={styles.idText} selectable={true}>
                    {userInfo.app_user_id}
                  </Text>
                  <TouchableOpacity
                    style={styles.copyButton}
                    onPress={handleCopyId}
                  >
                    <Text style={styles.copyButtonText}>
                      {copied ? "コピーしました！" : "コピーする"}
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <Text style={styles.text}>
                  データがありません。Notion連携を完了させてください。
                </Text>
              )}
            </View>

            <Text
              style={[
                styles.text,
                { marginTop: 12, fontSize: 14, color: "#666" },
              ]}
            >
              ※
              このIDはお客様のアカウントを特定するための専用IDです。他の人には共有しないでください。
            </Text>
          </View>
        </AccordionItem>

        <View style={styles.linksContainer}>
          <TouchableOpacity
            onPress={() => setShowTerms(true)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>利用規約</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowPrivacy(true)}
            style={styles.linkButton}
          >
            <Text style={styles.linkText}>プライバシーポリシー</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TermsModal forceOpen={showTerms} onClose={() => setShowTerms(false)} />
      <PrivacyModal
        forceOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  content: {
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#444",
    marginBottom: 16,
    lineHeight: 24,
  },
  accordionContainer: {
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    overflow: "hidden",
  },
  accordionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  accordionContent: {
    paddingBottom: 12,
  },
  text: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
  },
  strong: {
    fontWeight: "bold",
    color: "#333",
  },
  image: {
    width: "100%",
    height: 400,
    marginVertical: 16,
  },
  idContainer: {
    marginTop: 16,
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    alignItems: "center",
  },
  idText: {
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#333",
    marginBottom: 12,
  },
  copyButton: {
    backgroundColor: "#2986ff",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  copyButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
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
  linksContainer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    paddingTop: 20,
    gap: 16,
  },
  linkButton: {
    paddingVertical: 8,
  },
  linkText: {
    fontSize: 16,
    color: "#007bff",
    textDecorationLine: "underline",
  },
});
