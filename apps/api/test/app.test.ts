import { describe, expect, it } from "vitest";
import { deriveIconSpec, type LogoSpec } from "@logomaker/logo-engine";
import { createApp } from "../src/app";
import type { ApiEnv } from "../src/env";

interface GenerateBody {
  specs: LogoSpec[];
  source: string;
}

const env: ApiEnv = {
  port: 0,
  textModel: "gpt-4o-mini",
  imageModel: "gpt-image-1",
};

const app = createApp(env);

const brief = {
  brandName: "Acme Coffee",
  industry: "coffee",
  keywords: ["warm"],
};

describe("API", () => {
  it("reports health and AI status", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body).toEqual({ ok: true, aiConfigured: false, imageAiConfigured: false });
  });

  it("generates concepts with the builtin generator when AI is off", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, count: 6 }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as GenerateBody;
    expect(body.source).toBe("builtin");
    expect(body.specs).toHaveLength(6);
  });

  it("rejects invalid briefs", async () => {
    const res = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief: { brandName: "" } }),
    });
    expect(res.status).toBe(400);
  });

  it("refines specs heuristically when AI is off", async () => {
    const gen = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, count: 1 }),
    });
    const { specs } = (await gen.json()) as GenerateBody;
    const res = await app.request("/refine", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: specs[0], instruction: "make it blue" }),
    });
    expect(res.status).toBe(200);
    const body = (await res.json()) as { spec: LogoSpec };
    expect(body.spec.palette.primary).toBe("#2563EB");
  });

  it("returns 503 for mark generation without AI", async () => {
    const res = await app.request("/generate-mark", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief }),
    });
    expect(res.status).toBe(503);
  });

  it("exports a zip brand kit", async () => {
    const gen = await app.request("/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brief, count: 1 }),
    });
    const { specs } = (await gen.json()) as GenerateBody;
    const res = await app.request("/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spec: specs[0], iconSpec: deriveIconSpec(specs[0]!) }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("application/zip");
    const bytes = new Uint8Array(await res.arrayBuffer());
    // zip magic number "PK"
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);
    expect(bytes.length).toBeGreaterThan(10_000);
  }, 30_000);
});
