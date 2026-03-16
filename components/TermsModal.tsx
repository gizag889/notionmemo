import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const TERMS_AGREED_KEY = "TERMS_AGREED_KEY";

interface TermsModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function TermsModal({ forceOpen = false, onClose }: TermsModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkTerms = async () => {
      try {
        const hasAgreed = await AsyncStorage.getItem(TERMS_AGREED_KEY);
        if (hasAgreed !== "true" && !forceOpen) {
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Failed to check terms agreement", e);
        // Error on read, maybe show to be safe
        setIsVisible(true);
      }
    };
    if (!forceOpen) {
      checkTerms();
    }
  }, [forceOpen]);

  const modalVisible = forceOpen || isVisible;

  const handleAgree = async () => {
    try {
      if (!forceOpen) {
        await AsyncStorage.setItem(TERMS_AGREED_KEY, "true");
      }
      setIsVisible(false);
      onClose?.();
    } catch (e) {
      console.error("Failed to save terms agreement", e);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={modalVisible}
      onRequestClose={() => {
        if (forceOpen) {
          onClose?.();
        }
      }}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <Text style={styles.h1}>利用規約</Text>

          <Text style={styles.strong}>※必ず最後までお読みください。</Text>

          <Text style={styles.h2}>1. はじめに</Text>
          <Text style={styles.p}>
            この利用規約（以下「本規約」）は、
            <Text style={styles.important}>Yuhi Aoyagi</Text>
            （以下「当開発者」）が提供するAndroidアプリ「Viewer Memo for
            Notion」（以下「本アプリ」）の利用条件を定めるものです。ユーザーは本アプリを利用することで、本規約に同意したものとみなされます。
          </Text>

          <Text style={styles.h2}>2. サービスの提供と非公式性</Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • 本アプリは、Notion Labs, Inc.が提供するNotion
              APIを利用して提供されるサードパーティ製のツールです。当開発者はNotion
              Labs,
              Inc.とは一切関係がなく、本アプリは公式なサービスではありません。
            </Text>
            <Text style={styles.li}>
              •
              本アプリの利用には、ユーザー自身のNotionアカウントおよびAPI設定が必要です。
            </Text>
          </View>

          <Text style={styles.h2}>3. 禁止事項</Text>
          <Text style={styles.p}>
            ユーザーは、本アプリの利用にあたり、以下の行為を行ってはなりません。
          </Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • 本アプリの逆アセンブル、逆コンパイル、リバースエンジニアリング。
            </Text>
            <Text style={styles.li}>
              • Notion APIの利用規約に違反する行為。
            </Text>
            <Text style={styles.li}>
              •
              当開発者または第三者のサーバーやネットワークに過度な負荷をかける行為。
            </Text>
            <Text style={styles.li}>
              • その他、当開発者が不適切と判断する行為。
            </Text>
          </View>

          <Text style={styles.h2}>4. 免責事項（重要）</Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              <Text style={styles.important}>APIへの依存:</Text>{" "}
              本アプリはNotion
              APIに依存しています。Notionの仕様変更、APIの停止、制限の強化等により、本アプリの機能が制限されたり、利用不能になったりした場合でも、当開発者は一切の責任を負いません。
            </Text>
            <Text style={styles.li}>
              <Text style={styles.important}>データの保証:</Text>{" "}
              通信エラー、バグ、その他の要因によるデータの消失、破損、誤送信について、当開発者は一切の責任を負いません。重要なデータは必ず公式のNotion環境でバックアップを管理してください。
            </Text>
            <Text style={styles.li}>
              <Text style={styles.important}>損害賠償:</Text>{" "}
              本アプリの利用に関連してユーザーに生じた直接的または間接的な損害について、当開発者は一切の賠償責任を負わないものとします。
            </Text>
          </View>

          <Text style={styles.h2}>5. サービスの変更・終了</Text>
          <Text style={styles.p}>
            当開発者は、ユーザーへの事前通知なく、本アプリの内容を変更し、または提供を中止することができるものとします。
          </Text>

          <Text style={styles.h2}>6. 準拠法と管轄裁判所</Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • 本規約の解釈にあたっては日本法を準拠法とします。
            </Text>
            <Text style={styles.li}>
              •
              紛争が生じた場合は、当開発者の所在地を管轄する裁判所を専属的合意管轄とします。
            </Text>
          </View>

          <Text style={styles.footer}>最終更新日：2026年3月16日</Text>

          <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
            <Text style={styles.agreeButtonText}>
              {forceOpen ? "閉じる" : "同意してプライバシーポリシーへ"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 40,
    backgroundColor: "#fff",
    borderRadius: 8,
    margin: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  h1: {
    fontSize: 24,
    fontWeight: "bold",
    borderBottomWidth: 2,
    borderBottomColor: "#333",
    paddingBottom: 10,
    marginBottom: 30,
    color: "#333",
  },
  h2: {
    fontSize: 20,
    fontWeight: "bold",
    borderLeftWidth: 5,
    borderLeftColor: "#28a745",
    paddingLeft: 10,
    marginTop: 30,
    marginBottom: 16,
    color: "#333",
  },
  strong: {
    color: "#d9534f",
    fontWeight: "bold",
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  ul: {
    marginBottom: 16,
  },
  li: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 8,
    marginLeft: 10,
    paddingRight: 10,
  },
  important: {
    color: "#d9534f",
    fontWeight: "bold",
  },
  footer: {
    marginTop: 40,
    marginBottom: 40,
    fontSize: 14,
    color: "#666",
    textAlign: "right",
  },
  agreeButton: {
    backgroundColor: "#2986ff",
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  agreeButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
