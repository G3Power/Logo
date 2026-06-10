export interface ApiEnv {
  port: number;
  /** Anthropic key; enables Claude-powered concept generation and refine. */
  anthropicApiKey?: string;
  /** OpenAI-compatible key; enables LLM text features and AI image marks. */
  openaiApiKey?: string;
  /** Optional custom base URL (e.g. Vercel AI Gateway) for OpenAI. */
  openaiBaseUrl?: string;
  /** Model used for structured concept generation. */
  textModel: string;
  /** Model used for raster mark generation (OpenAI only). */
  imageModel: string;
  supabaseUrl?: string;
  supabaseServiceKey?: string;
}

export function loadEnv(): ApiEnv {
  const anthropicApiKey =
    process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || undefined;
  return {
    port: Number(process.env.PORT ?? 8787),
    anthropicApiKey,
    openaiApiKey: process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY || undefined,
    openaiBaseUrl: process.env.OPENAI_BASE_URL || undefined,
    textModel:
      process.env.LOGO_TEXT_MODEL ?? (anthropicApiKey ? "claude-sonnet-4-6" : "gpt-4o-mini"),
    imageModel: process.env.LOGO_IMAGE_MODEL ?? "gpt-image-1",
    supabaseUrl: process.env.SUPABASE_URL || undefined,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
  };
}
