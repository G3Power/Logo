import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config, supabaseConfigured } from "./config";

export const supabase: SupabaseClient | null = supabaseConfigured
  ? createClient(config.supabaseUrl!, config.supabaseAnonKey!, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    })
  : null;
