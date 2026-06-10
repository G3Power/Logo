import type { LogoSpec } from "@logomaker/logo-engine";
import type { GenerateMarkRequest, GenerateRequest, RefineRequest } from "./schemas";

export interface GenerateResponse {
  specs: LogoSpec[];
  /** "ai" when produced by an LLM, "builtin" for the offline generator. */
  source: "ai" | "builtin";
}

export interface RefineResponse {
  spec: LogoSpec;
  source: "ai" | "builtin";
}

export interface GenerateMarkResponse {
  /** Data URL or storage URL of the generated transparent PNG mark. */
  url: string;
}

export interface HealthResponse {
  ok: boolean;
  aiConfigured: boolean;
  imageAiConfigured: boolean;
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ApiClient {
  constructor(private baseUrl: string) {}

  private async post<T>(path: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      let message = `Request failed (${res.status})`;
      try {
        const data = (await res.json()) as { error?: string };
        if (data.error) message = data.error;
      } catch {
        // non-JSON error body; keep the status message
      }
      throw new ApiError(res.status, message);
    }
    return (await res.json()) as T;
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    if (!res.ok) throw new ApiError(res.status, "Health check failed");
    return (await res.json()) as HealthResponse;
  }

  generate(req: GenerateRequest): Promise<GenerateResponse> {
    return this.post("/generate", req);
  }

  refine(req: RefineRequest): Promise<RefineResponse> {
    return this.post("/refine", req);
  }

  generateMark(req: GenerateMarkRequest): Promise<GenerateMarkResponse> {
    return this.post("/generate-mark", req);
  }
}
