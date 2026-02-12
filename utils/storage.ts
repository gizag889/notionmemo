// utils/storage.ts
import * as SecureStore from 'expo-secure-store';

export async function saveAuthData(userId: string) {
  await SecureStore.setItemAsync('user_id', userId);
}

export async function getAuthData() {
  return await SecureStore.getItemAsync('user_id');
}

export async function deleteAuthData() {
  await SecureStore.deleteItemAsync('user_id');
}