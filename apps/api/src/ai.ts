import { createOpenAI, type OpenAIProvider } from "@ai-sdk/openai";
import { generateObject, experimental_generateImage as generateImage } from "ai";
import { z } from "zod";
import {
  FONT_PAIRINGS,
  MARKS,
  MARK_IDS,
  getFontPairing,
  newSpecId,
  type Brief,
  type LogoSpec,
} from "@logomaker/logo-engine";
import type { ApiEnv } from "./env";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/);

const aiConceptSchema = z.object({
  layout: z.enum(["icon-left", "icon-top", "wordmark", "badge", "monogram"]),
  casing: z.enum(["upper", "title", "lower"]),
  markId: z.enum(["monogram", ...MARK_IDS] as [string, ...string[]]),
  markStyle: z.enum(["solid", "duotone", "outline"]),
  fontPairingId: z.enum(FONT_PAIRINGS.map((f) => f.id) as [string, ...string[]]),
  palette: z.object({
    primary: hexColor,
    secondary: hexColor,
    text: hexColor,
    background: hexColor,
  }),
  badgeShape: z.enum(["circle", "shield", "hexagon", "rounded"]).optional(),
});

const aiResponseSchema = z.object({
  concepts: z.array(aiConceptSchema).min(1),
});

function markCatalog(): string {
  return MARKS.map((m) => `- ${m.id}: ${m.name} (${m.tags.join(", ")})`).join("\n");
}

function fontCatalog(): string {
  return FONT_PAIRINGS.map((f) => `- ${f.id}: ${f.name} (${f.tags.join(", ")})`).join("\n");
}

function expandConcept(
  concept: z.infer<typeof aiConceptSchema>,
  brief: Brief,
): LogoSpec {
  const pairing = getFontPairing(concept.fontPairingId) ?? FONT_PAIRINGS[0]!;
  return {
    id: newSpecId(),
    brandName: brief.brandName,
    tagline: brief.tagline || undefined,
    layout: concept.layout,
    casing: concept.casing,
    markId: concept.layout === "monogram" ? "monogram" : concept.markId,
    markStyle: concept.markStyle,
    markScale: 1,
    spacing: 1,
    palette: concept.palette,
    nameFont: pairing.nameFont,
    taglineFont: pairing.taglineFont,
    badgeShape: concept.layout === "badge" ? (concept.badgeShape ?? "circle") : undefined,
  };
}

export class AiService {
  private provider: OpenAIProvider | null;

  constructor(private env: ApiEnv) {
    this.provider = env.openaiApiKey
      ? createOpenAI({ apiKey: env.openaiApiKey, baseURL: env.openaiBaseUrl })
      : null;
  }

  get textConfigured(): boolean {
    return this.provider !== null;
  }

  get imageConfigured(): boolean {
    return this.provider !== null;
  }

  async generateConcepts(brief: Brief, count: number): Promise<LogoSpec[]> {
    if (!this.provider) throw new Error("AI provider not configured");
    const { object } = await generateObject({
      model: this.provider(this.env.textModel),
      schema: aiResponseSchema,
      system:
        "You are a senior brand identity designer. You design logo concepts by " +
        "selecting from a curated component library and choosing harmonious, " +
        "accessible color palettes (text must contrast with background; " +
        "background is usually near-white or near-black). Produce diverse " +
        "concepts: vary layout, mark, typography and mood. Avoid cliché " +
        "choices; match the brand's industry and personality.\n\n" +
        `Available marks:\n${markCatalog()}\n\nAvailable font pairings:\n${fontCatalog()}`,
      prompt:
        `Design ${count} distinct logo concepts for this brand:\n` +
        `Name: ${brief.brandName}\n` +
        (brief.tagline ? `Tagline: ${brief.tagline}\n` : "") +
        `Industry: ${brief.industry}\n` +
        `Personality keywords: ${brief.keywords.join(", ") || "none provided"}\n` +
        (brief.preferredColors?.length
          ? `Preferred colors (use as palette anchors in most concepts): ${brief.preferredColors.join(", ")}\n`
          : "") +
        `Return exactly ${count} concepts.`,
    });
    return object.concepts.slice(0, count).map((c) => expandConcept(c, brief));
  }

  async refine(spec: LogoSpec, instruction: string): Promise<LogoSpec> {
    if (!this.provider) throw new Error("AI provider not configured");
    const brief: Brief = {
      brandName: spec.brandName,
      tagline: spec.tagline,
      industry: "unknown",
      keywords: [],
    };
    const { object } = await generateObject({
      model: this.provider(this.env.textModel),
      schema: aiConceptSchema,
      system:
        "You revise an existing logo concept according to the user's instruction. " +
        "Change only what the instruction implies; keep everything else identical.\n\n" +
        `Available marks:\n${markCatalog()}\n\nAvailable font pairings:\n${fontCatalog()}`,
      prompt:
        `Current concept:\n${JSON.stringify(
          {
            layout: spec.layout,
            casing: spec.casing,
            markId: spec.markId,
            markStyle: spec.markStyle,
            fontPairingId:
              FONT_PAIRINGS.find((f) => f.nameFont.family === spec.nameFont.family)?.id ??
              FONT_PAIRINGS[0]!.id,
            palette: spec.palette,
            badgeShape: spec.badgeShape,
          },
          null,
          2,
        )}\n\nInstruction: ${instruction}`,
    });
    const revised = expandConcept(object, brief);
    return {
      ...spec,
      ...revised,
      id: newSpecId(),
      markScale: spec.markScale,
      spacing: spec.spacing,
      rasterMarkUrl: spec.rasterMarkUrl,
    };
  }

  /** Generate a unique raster mark; returns PNG bytes. */
  async generateMark(brief: Brief, markPrompt?: string): Promise<Uint8Array> {
    if (!this.provider) throw new Error("AI provider not configured");
    const { image } = await generateImage({
      model: this.provider.image(this.env.imageModel),
      prompt:
        `A single iconic logo mark for "${brief.brandName}", a ${brief.industry} brand. ` +
        (markPrompt ? `${markPrompt}. ` : "") +
        `Style: flat vector emblem, bold simple shapes, ${
          brief.keywords.join(", ") || "modern, clean"
        }. Centered on a fully transparent background. No text, no letters, no words.`,
      size: "1024x1024",
    });
    return image.uint8Array;
  }
}
