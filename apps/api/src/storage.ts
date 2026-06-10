import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ApiEnv } from "./env";

const BUCKET = "logo-assets";

/**
 * Stores generated raster marks. Uses Supabase storage when configured,
 * otherwise returns data URLs so the app keeps working without credentials.
 */
export class AssetStorage {
  private supabase: SupabaseClient | null;

  constructor(env: ApiEnv) {
    this.supabase =
      env.supabaseUrl && env.supabaseServiceKey
        ? createClient(env.supabaseUrl, env.supabaseServiceKey)
        : null;
  }

  async storePng(bytes: Uint8Array, keyHint: string): Promise<string> {
    if (this.supabase) {
      const key = `marks/${keyHint}-${Date.now().toString(36)}.png`;
      const { error } = await this.supabase.storage
        .from(BUCKET)
        .upload(key, bytes, { contentType: "image/png", upsert: false });
      if (!error) {
        const { data } = this.supabase.storage.from(BUCKET).getPublicUrl(key);
        return data.publicUrl;
      }
      console.warn("Supabase upload failed, falling back to data URL:", error.message);
    }
    return `data:image/png;base64,${Buffer.from(bytes).toString("base64")}`;
  }
}
