import { serve } from "@hono/node-server";
import { createApp } from "./app";
import { loadEnv } from "./env";

const env = loadEnv();
const app = createApp(env);

serve({ fetch: app.fetch, port: env.port }, (info) => {
  console.log(`Logomaker API listening on http://localhost:${info.port}`);
  console.log(`  AI text generation:  ${env.openaiApiKey ? "configured" : "OFF (builtin generator)"}`);
  console.log(`  Supabase storage:    ${env.supabaseUrl ? "configured" : "OFF (data URLs)"}`);
});
