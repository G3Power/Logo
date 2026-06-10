import { Hono } from "hono";
import { cors } from "hono/cors";
import {
  exportRequestSchema,
  generateMarkRequestSchema,
  generateRequestSchema,
  refineRequestSchema,
} from "@logomaker/shared";
import {
  generateConcepts,
  refineHeuristically,
  type Brief,
  type LogoSpec,
} from "@logomaker/logo-engine";
import { AiService } from "./ai";
import { AssetStorage } from "./storage";
import { buildExportZip } from "./exporter";
import type { ApiEnv } from "./env";

/** Fixed-window per-IP rate limiter; adequate for a single-instance API. */
function rateLimiter(limit: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (ip: string): boolean => {
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || entry.resetAt < now) {
      hits.set(ip, { count: 1, resetAt: now + windowMs });
      return true;
    }
    entry.count += 1;
    return entry.count <= limit;
  };
}

export function createApp(env: ApiEnv): Hono {
  const ai = new AiService(env);
  const storage = new AssetStorage(env);
  const allowGenerate = rateLimiter(30, 60_000);
  const allowImage = rateLimiter(6, 60_000);

  const app = new Hono();
  app.use("*", cors());

  const clientIp = (c: { req: { header: (n: string) => string | undefined } }) =>
    c.req.header("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  app.get("/health", (c) =>
    c.json({ ok: true, aiConfigured: ai.textConfigured, imageAiConfigured: ai.imageConfigured }),
  );

  app.post("/generate", async (c) => {
    if (!allowGenerate(clientIp(c))) return c.json({ error: "Rate limit exceeded" }, 429);
    const parsed = generateRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);

    const { brief, count, seed } = parsed.data;
    if (ai.textConfigured) {
      try {
        const specs = await ai.generateConcepts(brief as Brief, count);
        return c.json({ specs, source: "ai" });
      } catch (err) {
        console.error("AI generation failed, using builtin generator:", err);
      }
    }
    const specs = generateConcepts(brief as Brief, count, seed);
    return c.json({ specs, source: "builtin" });
  });

  app.post("/refine", async (c) => {
    if (!allowGenerate(clientIp(c))) return c.json({ error: "Rate limit exceeded" }, 429);
    const parsed = refineRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);

    const { spec, instruction } = parsed.data;
    if (ai.textConfigured) {
      try {
        const revised = await ai.refine(spec as LogoSpec, instruction);
        return c.json({ spec: revised, source: "ai" });
      } catch (err) {
        console.error("AI refine failed, using heuristic refine:", err);
      }
    }
    return c.json({ spec: refineHeuristically(spec as LogoSpec, instruction), source: "builtin" });
  });

  app.post("/generate-mark", async (c) => {
    if (!allowImage(clientIp(c))) return c.json({ error: "Rate limit exceeded" }, 429);
    const parsed = generateMarkRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);

    if (!ai.imageConfigured) {
      return c.json(
        { error: "AI image generation is not configured on this server. Set OPENAI_API_KEY." },
        503,
      );
    }
    try {
      const bytes = await ai.generateMark(parsed.data.brief as Brief, parsed.data.markPrompt);
      const url = await storage.storePng(
        bytes,
        parsed.data.brief.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      );
      return c.json({ url });
    } catch (err) {
      console.error("Mark generation failed:", err);
      return c.json({ error: "Image generation failed. Please try again." }, 502);
    }
  });

  app.post("/export", async (c) => {
    const parsed = exportRequestSchema.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, 400);

    try {
      const zipBuffer = await buildExportZip(parsed.data.spec as LogoSpec, parsed.data.iconSpec);
      const fileName = `${parsed.data.spec.brandName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-brand-kit.zip`;
      return c.body(new Uint8Array(zipBuffer), 200, {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      });
    } catch (err) {
      console.error("Export failed:", err);
      return c.json({ error: "Export failed. Please try again." }, 500);
    }
  });

  return app;
}
