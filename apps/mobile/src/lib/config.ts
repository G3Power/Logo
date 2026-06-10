import { Platform } from "react-native";
import Constants from "expo-constants";

function defaultApiUrl(): string {
  // On a device/emulator the API runs on the dev machine; derive its LAN IP
  // from the Metro host so local development works without configuration.
  const host = Constants.expoConfig?.hostUri?.split(":")[0];
  if (Platform.OS !== "web" && host) return `http://${host}:8787`;
  return "http://localhost:8787";
}

export const config = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? defaultApiUrl(),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
};

export const supabaseConfigured = Boolean(config.supabaseUrl && config.supabaseAnonKey);
