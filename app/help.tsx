import { Stack } from "expo-router";
import { ChevronDown, ChevronUp } from "lucide-react-native";
import { useState } from "react";
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

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
  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: "ヘルプ" }} />
      <View style={styles.content}>
        <Text style={styles.title}>Notion Viewer の使い方</Text>
        <Text style={styles.description}>
          このアプリは、Notionの最新のメモを素早く確認・追加するためのツールです。
        </Text>

        <AccordionItem title="1. メモの確認">
          <Text style={styles.text}>
            メイン画面では、連携しているNotionデータベースの最新のメモが表示されます。
          </Text>
        </AccordionItem>

        <AccordionItem title="2. クイック追加">
          <Text style={styles.text}>
            画面下部やホーム画面のウィジェットから、素早くNotionにメモを追加できます。
          </Text>
        </AccordionItem>

        <AccordionItem title="注意事項">
          <Text style={styles.text}>
            ネットワーク環境によって、情報の更新に時間がかかる場合があります。
          </Text>
        </AccordionItem>
      </View>
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
});
