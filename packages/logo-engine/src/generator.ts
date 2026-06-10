import { MARKS } from "./marks";
import { FONT_PAIRINGS, type FontPairing } from "./fonts";
import { PALETTES, paletteFromSeed, type CuratedPalette } from "./palettes";
import type { Brief, Casing, LayoutVariant, LogoSpec, MarkStyle, Palette } from "./types";

/** Deterministic PRNG (mulberry32) so the same seed reproduces concepts. */
function mulberry32(seed: number): () => number {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

/** Score items whose tags overlap the brief's terms; falls back to all. */
function rankByTags<T extends { tags: string[] }>(items: readonly T[], terms: string[]): T[] {
  const t = terms.map((x) => x.toLowerCase());
  const scored = items
    .map((item) => ({
      item,
      score: item.tags.reduce(
        (acc, tag) => acc + (t.some((term) => term.includes(tag) || tag.includes(term)) ? 1 : 0),
        0,
      ),
    }))
    .sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.item);
  return matched.length >= 3 ? matched : [...matched, ...items.filter((i) => !matched.includes(i))];
}

const LAYOUT_ROTATION: LayoutVariant[] = [
  "icon-left",
  "icon-top",
  "wordmark",
  "monogram",
  "badge",
  "icon-left",
  "icon-top",
  "wordmark",
];

let counter = 0;

export function newSpecId(): string {
  counter = (counter + 1) % 0xffff;
  return `spec-${Date.now().toString(36)}-${counter.toString(36)}-${Math.floor(Math.random() * 1e6).toString(36)}`;
}

/**
 * Deterministic, offline concept generation from a brief. Serves as the
 * fallback when no AI provider is configured and powers "shuffle".
 */
export function generateConcepts(brief: Brief, count = 8, seed?: number): LogoSpec[] {
  const terms = [brief.industry, ...brief.keywords].filter(Boolean);
  const rand = mulberry32(seed ?? hashString(JSON.stringify(brief) + Date.now().toString()));

  const rankedMarks = rankByTags(MARKS, terms);
  const rankedFonts = rankByTags(FONT_PAIRINGS, terms);
  const rankedPalettes = rankByTags(PALETTES, terms);

  const specs: LogoSpec[] = [];
  for (let i = 0; i < count; i++) {
    const layout = LAYOUT_ROTATION[i % LAYOUT_ROTATION.length]!;
    const fontPairing: FontPairing = rankedFonts[(i + Math.floor(rand() * 2)) % rankedFonts.length]!;

    let palette: Palette;
    const preferred = brief.preferredColors?.filter(Boolean) ?? [];
    if (preferred.length > 0 && rand() < 0.75) {
      palette = paletteFromSeed(pick(rand, preferred));
    } else {
      const curated: CuratedPalette = rankedPalettes[(i + Math.floor(rand() * 3)) % rankedPalettes.length]!;
      palette = {
        primary: curated.primary,
        secondary: curated.secondary,
        text: curated.text,
        background: curated.background,
      };
    }

    const markId =
      layout === "monogram"
        ? "monogram"
        : rankedMarks[(i + Math.floor(rand() * 2)) % Math.max(1, Math.min(rankedMarks.length, 10))]!.id;

    const markStyle = pick(rand, ["solid", "duotone", "duotone", "outline"] as const satisfies readonly MarkStyle[]);
    const casing: Casing =
      layout === "badge" || fontPairing.id === "bebas-inter"
        ? "upper"
        : pick(rand, ["title", "title", "upper", "lower"] as const);

    specs.push({
      id: newSpecId(),
      brandName: brief.brandName,
      tagline: brief.tagline || undefined,
      layout,
      casing,
      markId,
      markStyle,
      markScale: 0.9 + rand() * 0.3,
      spacing: 0.9 + rand() * 0.3,
      palette,
      nameFont: fontPairing.nameFont,
      taglineFont: fontPairing.taglineFont,
      badgeShape: layout === "badge" ? pick(rand, ["circle", "shield", "hexagon", "rounded"] as const) : undefined,
    });
  }
  return specs;
}

/**
 * Offline heuristic refinement: applies simple instruction keywords to a
 * spec. The AI-backed refine endpoint supersedes this when available.
 */
export function refineHeuristically(spec: LogoSpec, instruction: string): LogoSpec {
  const q = instruction.toLowerCase();
  const next: LogoSpec = { ...spec, id: newSpecId(), palette: { ...spec.palette } };
  const rand = mulberry32(hashString(instruction + spec.id));

  if (/(bigger|larger) (icon|mark)/.test(q)) next.markScale = Math.min(1.6, next.markScale + 0.2);
  if (/(smaller) (icon|mark)/.test(q)) next.markScale = Math.max(0.6, next.markScale - 0.2);
  if (/upper ?case|all caps|capital/.test(q)) next.casing = "upper";
  if (/lower ?case/.test(q)) next.casing = "lower";
  if (/outline/.test(q)) next.markStyle = "outline";
  if (/solid/.test(q)) next.markStyle = "solid";

  const colorWords: Record<string, string> = {
    red: "#D7263D", blue: "#2563EB", green: "#1F9D55", purple: "#7C3AED",
    pink: "#DB2777", orange: "#EA7317", yellow: "#EAB308", teal: "#0D9488",
    black: "#16161A", gold: "#C9A227", brown: "#7C4A21",
  };
  for (const [word, hex] of Object.entries(colorWords)) {
    if (q.includes(word)) {
      const p = paletteFromSeed(hex);
      next.palette = p;
      break;
    }
  }

  if (/playful|fun|friendly/.test(q)) {
    const playful = FONT_PAIRINGS.filter((f) => f.tags.includes("playful") || f.tags.includes("friendly"));
    const f = pick(rand, playful.length ? playful : FONT_PAIRINGS);
    next.nameFont = f.nameFont;
    next.taglineFont = f.taglineFont;
  }
  if (/serious|professional|corporate|elegant|luxury/.test(q)) {
    const formal = FONT_PAIRINGS.filter((f) =>
      f.tags.some((t) => ["corporate", "elegant", "luxury", "classic", "trust"].includes(t)),
    );
    const f = pick(rand, formal.length ? formal : FONT_PAIRINGS);
    next.nameFont = f.nameFont;
    next.taglineFont = f.taglineFont;
  }
  if (/minimal|simple|clean/.test(q)) {
    next.layout = "wordmark";
    next.markStyle = "outline";
  }
  return next;
}
