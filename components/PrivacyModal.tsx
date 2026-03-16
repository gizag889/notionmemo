import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
    Linking,
    Modal,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const PRIVACY_AGREED_KEY = "PRIVACY_AGREED_KEY";

interface PrivacyModalProps {
  forceOpen?: boolean;
  onClose?: () => void;
}

export function PrivacyModal({
  forceOpen = false,
  onClose,
}: PrivacyModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkPrivacy = async () => {
      try {
        const hasAgreed = await AsyncStorage.getItem(PRIVACY_AGREED_KEY);
        if (hasAgreed !== "true" && !forceOpen) {
          setIsVisible(true);
        }
      } catch (e) {
        console.error("Failed to check privacy agreement", e);
        setIsVisible(true);
      }
    };
    if (!forceOpen) {
      checkPrivacy();
    }
  }, [forceOpen]);

  const modalVisible = forceOpen || isVisible;

  const handleAgree = async () => {
    try {
      if (!forceOpen) {
        await AsyncStorage.setItem(PRIVACY_AGREED_KEY, "true");
      }
      setIsVisible(false);
      onClose?.();
    } catch (e) {
      console.error("Failed to save privacy agreement", e);
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
          <Text style={styles.h1}>プライバシーポリシー</Text>

          <Text style={styles.strong}>※必ず最後までお読みください。</Text>

          <View style={styles.importantNotice}>
            <Text style={styles.h3}>【重要：Notion との関係について】</Text>
            <View style={styles.blockquote}>
              <Text style={styles.p}>
                本アプリケーション（以下「本アプリ」といいます）は、独立した開発者である
                <Text style={styles.strong}>「Yuhi Aoyagi」</Text>
                によって開発・運営されています。本アプリは、Notion Labs, Inc.
                と提携、後援、または承認された公式の製品ではありません。「Notion」の名称、ロゴ、および関連する商標は、Notion
                Labs, Inc. に帰属します。
              </Text>
            </View>
          </View>

          <Text style={styles.h2}>1. 収集する情報と利用目的</Text>
          <Text style={styles.p}>
            本アプリは、Notion
            との連携およびメモ機能の提供を目的として、以下の情報を取得・利用します。これらの情報は本アプリの機能を提供するためだけに利用され、当開発者が閲覧したり、目的外の利用をしたりすることは一切ありません。
          </Text>

          {/* Table Simulator */}
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text
                style={[styles.tableCell, styles.headerText, { flex: 1.1 }]}
              >
                項目
              </Text>
              <Text
                style={[styles.tableCell, styles.headerText, { flex: 2.2 }]}
              >
                利用目的
              </Text>
              <Text
                style={[
                  styles.tableCell,
                  styles.headerText,
                  { flex: 1.4, borderRightWidth: 0 },
                ]}
              >
                保護措置
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCell, styles.tableStrong, { flex: 1.1 }]}
              >
                ユーザー ID
              </Text>
              <Text style={[styles.tableCell, { flex: 2.2 }]}>
                アプリ内でのユーザー識別および Notion
                との連携状態の管理に使用します。
              </Text>
              <Text
                style={[styles.tableCell, { flex: 1.4, borderRightWidth: 0 }]}
              >
                適切に管理
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCell, styles.tableStrong, { flex: 1.1 }]}
              >
                Notion アクセストークン
              </Text>
              <Text style={[styles.tableCell, { flex: 2.2 }]}>
                Notion API
                を通じてコンテンツ（ページ情報の取得・操作）を操作するために使用します。
              </Text>
              <Text
                style={[styles.tableCell, { flex: 1.4, borderRightWidth: 0 }]}
              >
                <Text style={styles.tableStrong}>AES-GCM 方式</Text>
                による暗号化保存
              </Text>
            </View>
            <View style={styles.tableRow}>
              <Text
                style={[styles.tableCell, styles.tableStrong, { flex: 1.1 }]}
              >
                Notion コンテンツ
              </Text>
              <Text style={[styles.tableCell, { flex: 2.2 }]}>
                ウィジェットへの表示、および情報の送信機能を実現するために使用します。
              </Text>
              <Text
                style={[styles.tableCell, { flex: 1.4, borderRightWidth: 0 }]}
              >
                目的外利用の禁止
              </Text>
            </View>
          </View>

          <Text style={styles.p}>
            <Text style={styles.strong}>保護措置について:</Text>{" "}
            取得したアクセストークンは、標準的かつ強力な暗号化技術である{" "}
            <Text style={styles.strong}>AES-GCM 方式</Text>{" "}
            を用いて暗号化された状態で保存されます。これにより、悪意のある第三者や開発者が不正に利用・解読できないよう厳重に保護されています。
          </Text>

          <Text style={styles.h2}>2. データの保存とセキュリティ</Text>
          <Text style={styles.p}>
            本アプリは、ユーザーデータの機密性を確保するために、適切なセキュリティ対策を講じています。
          </Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • 重要情報は <Text style={styles.strong}>AES-GCM 方式</Text>{" "}
              による暗号化を施しています。
            </Text>
            <Text style={styles.li}>
              •
              取得したデータは、アプリの機能提供に必要な範囲内でのみ保持されます。
            </Text>
          </View>

          <Text style={styles.h2}>3. データの自動削除と保持期間</Text>
          <Text style={styles.p}>
            ユーザーデータの肥大化防止とプライバシー保護のため、以下の通り自動削除処理を実施します。
          </Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • <Text style={styles.strong}>非アクティブデータの削除:</Text>{" "}
              最終更新（利用）から{" "}
              <Text style={styles.strong}>90 日が経過</Text> したユーザーデータ
              は、自動的に削除されます。
            </Text>
            <Text style={styles.li}>
              • <Text style={styles.strong}>キャッシュデータの削除:</Text>{" "}
              フェッチ（取得）されていないキャッシュデータは、定期的に自動削除されます。
            </Text>
          </View>

          <Text style={styles.h2}>4. 免責事項（Notion 利用に関する補足）</Text>
          <View style={styles.ul}>
            <Text style={styles.li}>
              • 本アプリの利用には、別途 Notion
              サービスへの登録および利用規約への同意が必要です。
            </Text>
            <Text style={styles.li}>
              • 当開発者は、本アプリの使用によって生じた Notion
              側でのデータ損失、エラー、または Notion
              のアカウントに関するトラブルについて、当開発者の故意または重過失がある場合を除き、一切の責任を負いません。
            </Text>
          </View>

          <Text style={styles.h2}>5. 第三者への提供および共有</Text>
          <Text style={styles.p}>
            当開発者は、法令に基づく場合を除き、ユーザーの同意なく個人データを第三者に販売、共有、または提供することはありません。
          </Text>

          <Text style={styles.h2}>6. アカウントおよびデータの削除</Text>
          <Text style={styles.p}>
            ユーザーは、本アプリとの連携を解除することでデータの利用を停止できます。削除を希望される場合は、以下のリンクよりお手続きください。
          </Text>
          <View style={styles.ul}>
            <Text
              style={styles.li}
              onPress={() =>
                Linking.openURL("https://forms.gle/9hiKPnwAaRRy5vHk6")
              }
            >
              • データ削除リクエスト受付は
              <Text style={styles.link}>こちら</Text>
            </Text>
          </View>

          <Text style={styles.h2}>7. お問い合わせ先</Text>
          <Text
            style={styles.li}
            onPress={() =>
              Linking.openURL("https://forms.gle/9hiKPnwAaRRy5vHk6")
            }
          >
            本プライバシーポリシーまたはデータの取り扱いに関するお問い合わせは、
            <Text style={styles.link}>こちら</Text>の窓口までご連絡ください。
          </Text>

          <Text style={styles.footer}>最終更新日：2026年3月16日</Text>

          <TouchableOpacity style={styles.agreeButton} onPress={handleAgree}>
            <Text style={styles.agreeButtonText}>
              {forceOpen ? "閉じる" : "同意してはじめる"}
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
    borderLeftColor: "#007bff",
    paddingLeft: 10,
    marginTop: 30,
    marginBottom: 16,
    color: "#333",
  },
  h3: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 25,
    marginBottom: 10,
    color: "#333",
  },
  importantNotice: {
    marginBottom: 20,
  },
  blockquote: {
    backgroundColor: "#f0f7ff",
    borderLeftWidth: 5,
    borderLeftColor: "#007bff",
    padding: 15,
    marginVertical: 10,
  },
  p: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
    marginBottom: 16,
  },
  strong: {
    color: "#d9534f",
    fontWeight: "bold",
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    marginVertical: 20,
    backgroundColor: "#fff",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
  },
  tableHeader: {
    backgroundColor: "#f2f2f2",
  },
  tableCell: {
    padding: 12,
    borderRightWidth: 1,
    borderRightColor: "#ddd",
    fontSize: 14,
    color: "#333",
  },
  headerText: {
    fontWeight: "bold",
    textAlign: "left",
  },
  tableStrong: {
    fontWeight: "bold",
    color: "#d9534f",
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
  link: {
    color: "#007bff",
    textDecorationLine: "underline",
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
