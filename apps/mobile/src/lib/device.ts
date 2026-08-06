// Anonymous device identity — ORCHESTRATOR_CONTRACT.md §6. Generate once, persist forever.
import * as Crypto from "expo-crypto";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const DEVICE_ID_KEY = "asaase_device_id";

type WebStorage = {
  localStorage?: {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
  };
};

export async function getOrCreateDeviceId(): Promise<string> {
  if (Platform.OS === "web") {
    try {
      const storage = (globalThis as WebStorage).localStorage;
      const existing = storage?.getItem(DEVICE_ID_KEY);
      if (existing) return existing;
      const id = Crypto.randomUUID();
      storage?.setItem(DEVICE_ID_KEY, id);
      return id;
    } catch (e) {
      return Crypto.randomUUID();
    }
  }

  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY);
  if (existing) return existing;
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_ID_KEY, id);
  return id;
}
