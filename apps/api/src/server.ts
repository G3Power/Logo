import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadEnv } from "./env";

const env = loadEnv();
const app = createApp(env);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  const textProvider = env.anthropicApiKey
    ? `Anthropic (${env.textModel})`
    : env.openaiApiKey
      ? `OpenAI (${env.textModel})`
      : "OFF (builtin generator)";
  console.log(`Logomaker API listening on http://localhost:${info.port}`);
  console.log(`  AI text generation:  ${textProvider}`);
  console.log(`  AI image marks:      ${env.openaiApiKey ? `OpenAI (${env.imageModel})` : "OFF (requires OPENAI_API_KEY)"}`);
  console.log(`  Supabase storage:    ${env.supabaseUrl ? "configured" : "OFF (data URLs)"}`);
});
