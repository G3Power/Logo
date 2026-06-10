import {
  generateConcepts,
  refineHeuristically,
  type Brief,
  type LogoSpec,
} from "@logomaker/logo-engine";
import { ApiClient, type GenerateResponse, type RefineResponse } from "@logomaker/shared";
import { config } from "./config";

export const api = new ApiClient(config.apiUrl);

/**
 * Generate concepts via the API; if the server is unreachable the builtin
 * generator runs on-device so the app remains fully usable offline.
 */
export async function generateWithFallback(
  brief: Brief,
  count = 8,
  seed?: number,
): Promise<GenerateResponse> {
  try {
    return await api.generate({ brief, count, seed });
  } catch (err) {
    console.warn("API unreachable, generating on-device:", err);
    return { specs: generateConcepts(brief, count, seed), source: "builtin" };
  }
}

export async function refineWithFallback(
  spec: LogoSpec,
  instruction: string,
): Promise<RefineResponse> {
  try {
    return await api.refine({ spec, instruction });
  } catch (err) {
    console.warn("API unreachable, refining on-device:", err);
    return { spec: refineHeuristically(spec, instruction), source: "builtin" };
  }
}
