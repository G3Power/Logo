import { afterEach, describe, expect, it } from "vitest";
import { loadEnv } from "../src/env";

const KEYS = [
  "ANTHROPIC_API_KEY",
  "CLAUDE_API_KEY",
  "OPENAI_API_KEY",
  "AI_GATEWAY_API_KEY",
  "LOGO_TEXT_MODEL",
] as const;
const saved = KEYS.map((k) => [k, process.env[k]] as const);

afterEach(() => {
  for (const [k, v] of saved) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

function clearKeys() {
  for (const k of KEYS) delete process.env[k];
}

describe("loadEnv", () => {
  it("defaults to Claude when an Anthropic key is present", () => {
    clearKeys();
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    const env = loadEnv();
    expect(env.anthropicApiKey).toBe("sk-ant-test");
    expect(env.textModel).toBe("claude-sonnet-4-6");
  });

  it("accepts CLAUDE_API_KEY as an alias", () => {
    clearKeys();
    process.env.CLAUDE_API_KEY = "sk-ant-alias";
    const env = loadEnv();
    expect(env.anthropicApiKey).toBe("sk-ant-alias");
  });

  it("defaults to an OpenAI model without an Anthropic key", () => {
    clearKeys();
    process.env.OPENAI_API_KEY = "sk-test";
    const env = loadEnv();
    expect(env.anthropicApiKey).toBeUndefined();
    expect(env.textModel).toBe("gpt-4o-mini");
  });

  it("respects LOGO_TEXT_MODEL override", () => {
    clearKeys();
    process.env.ANTHROPIC_API_KEY = "sk-ant-test";
    process.env.LOGO_TEXT_MODEL = "claude-haiku-4-5";
    expect(loadEnv().textModel).toBe("claude-haiku-4-5");
  });
});
