// utils/storage.ts
import * as SecureStore from "expo-secure-store";

export async function saveAuthData(userId: string) {
  if (!userId) {
    console.error("saveAuthData に渡された値が空です");
    return;
  }
  await SecureStore.setItemAsync("MY_SECRET_USER_ID", userId);
}

export async function getAuthData() {
  const result = await SecureStore.getItemAsync("MY_SECRET_USER_ID");
  return result; // nullならデータなし、値があれば成功
}

export async function deleteAuthData() {
  await SecureStore.deleteItemAsync("MY_SECRET_USER_ID");
}
