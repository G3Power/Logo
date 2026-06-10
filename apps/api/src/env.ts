export interface ApiEnv {
  port: number;
  /** OpenAI-compatible key; enables LLM concept generation and refine. */
  openaiApiKey?: string;
  /** Optional custom base URL (e.g. Vercel AI Gateway). */
  openaiBaseUrl?: string;
  /** Model used for structured concept generation. */
  textModel: string;
  /** Model used for raster mark generation. */
  imageModel: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export function loadEnv(): ApiEnv {
  return {
    port: Number(process.env.PORT ?? 8787),
    openaiApiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY || undefined,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
    textModel: process.env.LOGO_TEXT_MODEL ?? "gpt-4o-mini",
    imageModel: process.env.LOGO_IMAGE_MODEL ?? "gpt-image-1",
    supabaseUrl: process.env.SUPABASE_URL || undefined,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  };
}
