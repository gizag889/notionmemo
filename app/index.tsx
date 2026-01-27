"use no memo";
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';



export default function HomeScreen() {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  // Notionからデータを取得する関数
  const fetchNotionData = async () => {
    try {
      // 指定したページの「子ブロック」を取得
      const response = await fetch(`https://api.notion.com/v1/blocks/${process.env.EXPO_PUBLIC_DATABASE_ID}/children`, {
        headers: {
          'Authorization': `Bearer ${process.env.EXPO_PUBLIC_NOTION_TOKEN}`,
          'Notion-Version': '2022-06-28',
        },
      });
      const data = await response.json();

      // 例として、最初の3つのテキストブロックを結合して表示
      const textBlocks = data.results
        .filter((block: any) => block.type === 'paragraph')
        .map((block: any) => block.paragraph.rich_text[0]?.plain_text || '')
        .join('\n');

      setContent(textBlocks || '内容が空か、読み取れるテキストがありません。');
    } catch (error) {
      console.error(error);
      setContent('データの取得に失敗しました。');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchNotionData();
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotionData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#000" />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📌 Notion最新メモ</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.contentText}>{content}</Text>
      </View>

      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => router.push('/quick-input')}
      >
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  card: {
    margin: 20,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 3, // Androidの影
    shadowColor: '#000', // iOSの影
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  contentText: { fontSize: 16, lineHeight: 24, color: '#444' },
  fab: {
    position: 'absolute',
    right: 20,
    top: 500, // レイアウトに合わせて調整
    backgroundColor: '#000',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabText: { color: '#fff', fontSize: 30, marginBottom: 4 },
});