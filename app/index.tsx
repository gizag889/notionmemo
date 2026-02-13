import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { getAuthData } from "../utils/storage";

interface NotionPage {
  id: string;
  properties: any;
}

export default function Home() {
  const [pages, setPages] = useState<NotionPage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchNotionPages() {
      const userId = await getAuthData();
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://polished-grass-a069.gizaguri0426.workers.dev/get-pages?user_id=${userId}`,
        );
        const data = await response.json();
        console.log(data);
        // Notionのsearch APIの結果は results 配列に入っています
        setPages(data.results || []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchNotionPages();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ flex: 1 }} />;

  return (
    <View style={{ flex: 1, backgroundColor: "#121212", padding: 20 }}>
      <Text style={{ color: "white", fontSize: 24, marginBottom: 20 }}>
        私のNotionページ
      </Text>
      <FlatList
        data={pages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 15,
              borderBottomWidth: 1,
              borderBottomColor: "#333",
            }}
          >
            <Text style={{ color: "#FFEE58", fontSize: 18 }}>
              {item.properties?.title?.title[0]?.plain_text || "無題のページ"}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
