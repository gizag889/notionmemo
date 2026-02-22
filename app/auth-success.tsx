// app/auth-success.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { saveAuthData } from "../utils/storage";

//Notionの認証が完了すると、バックエンド（polished-grass-a069）からアプリのこのページ（auth-success）にリダイレクトされる
export default function AuthSuccess() {
  const { user_id, token } = useLocalSearchParams();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function handleLogin() {
      if (token && typeof token === "string") {
        try {
          const res = await fetch(
            "https://polished-grass-a069.gizaguri0426.workers.dev/auth/verify",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token }),
            },
          );
          const data = await res.json();

          if (res.ok && data.user_id) {
            await saveAuthData(data.user_id);
            router.replace("/");
          } else {
            console.error("JWT検証エラー:", data.error);
            setErrorMsg("認証情報の検証に失敗しました");
          }
        } catch (error) {
          console.error("ネットワークエラー:", error);
          setErrorMsg("通信エラーが発生しました");
        }
      } else if (user_id && typeof user_id === "string") {
        // 古いバージョン用（互換性確保用）
        await saveAuthData(user_id);
        router.replace("/");
      } else {
        console.log("エラー: トークンが無効です");
        setErrorMsg("無効な認証リンクです");
      }
    }
    handleLogin();
  }, [user_id, token]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#121212",
      }}
    >
      {errorMsg ? (
        <Text
          style={{
            color: "#ef5350",
            marginTop: 20,
            fontSize: 16,
            fontWeight: "bold",
          }}
        >
          {errorMsg}
        </Text>
      ) : (
        <>
          <ActivityIndicator size="large" color="#FFEE58" />
          <Text
            style={{
              color: "white",
              marginTop: 20,
              fontSize: 18,
              fontWeight: "bold",
            }}
          >
            認証を完了しています...
          </Text>
        </>
      )}
    </View>
  );
}
