// utils/storage.ts
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "MY_SECURE_AUTH_TOKEN";

export async function saveAuthData(token: string) {
  if (!token) {
    console.error("saveAuthData に渡された値が空です");
    return;
  }
  await SecureStore.setItemAsync(STORAGE_KEY, token);
}

export async function getAuthData() {
  const result = await SecureStore.getItemAsync(STORAGE_KEY);
  return result; // nullならデータなし、値があれば成功
}

export async function deleteAuthData() {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
