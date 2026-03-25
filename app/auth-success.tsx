// app/auth-success.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { saveAuthData } from "../utils/storage";
import { Button } from 'react-native';

import { InterstitialAd, AdEventType, TestIds } from 'react-native-google-mobile-ads';

const adUnitId = __DEV__ ? TestIds.INTERSTITIAL : 'ca-app-pub-3940256099942544/1033173712';

const interstitial = InterstitialAd.createForAdRequest(adUnitId, {
  requestNonPersonalizedAdsOnly: true,
});



//Notionの認証が完了すると、バックエンド（viewer-memo）からアプリのこのページ（auth-success）にリダイレクトされる
export default function AuthSuccess() {
  const { user_id, token } = useLocalSearchParams();
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);


  useEffect(() => {
    let isCancelled = false;

    // 広告の読み込みイベント
    const unsubscribeLoaded = interstitial.addAdEventListener(AdEventType.LOADED, () => {
      if (!isCancelled) setLoaded(true);
    });

    // 広告が閉じられた時のイベントで遷移させる
    const unsubscribeClosed = interstitial.addAdEventListener(AdEventType.CLOSED, () => {
      if (!isCancelled) router.replace("/");
    });

    // 広告をロード
    interstitial.load();

    async function handleLogin() {
      let isSuccess = false;
      if (token && typeof token === "string") {
        try {
          await saveAuthData(token);
          isSuccess = true;
        } catch (error) {
          console.error("保存エラー:", error);
          if (!isCancelled) setErrorMsg("認証情報の保存に失敗しました");
        }
      } else if (user_id && typeof user_id === "string") {
        await saveAuthData(user_id);
        isSuccess = true;
      } else {
        if (!isCancelled) setErrorMsg("無効な認証リンクです");
      }

      if (isSuccess && !isCancelled) {
        // 保存成功時点で広告がロードされていなければ、1秒だけロードを待つ猶予を持たせる
        setTimeout(() => {
          if (interstitial.loaded) {
            interstitial.show();
          } else {
            router.replace("/");
          }
        }, 3000); // 1秒遅延して広告の表示チャンスを増やす
      }
    }

    if (token || user_id) {
      handleLogin();
    }

    return () => {
      isCancelled = true;
      unsubscribeLoaded();
      unsubscribeClosed();
    };
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
