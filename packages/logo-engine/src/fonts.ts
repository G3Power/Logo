import type { FontSpec } from "./types";

export interface FontPairing {
  id: string;
  name: string;
  /** Personality tags used by generation to match the brief's vibe. */
  tags: string[];
  nameFont: FontSpec;
  taglineFont: FontSpec;
}

/**
 * Curated Google Fonts pairings. Families were chosen for logo suitability
 * (distinct silhouettes at display sizes) and permissive licensing.
 */
export const FONT_PAIRINGS: FontPairing[] = [
  {
    id: "grotesk-inter",
    name: "Modern Grotesk",
    tags: ["modern", "tech", "startup", "clean"],
    nameFont: { family: "Space Grotesk", weight: 700, letterSpacing: 0.01 },
    taglineFont: { family: "Inter", weight: 500, letterSpacing: 0.12 },
  },
  {
    id: "playfair-lato",
    name: "Editorial Serif",
    tags: ["elegant", "luxury", "editorial", "classic"],
    nameFont: { family: "Playfair Display", weight: 700, letterSpacing: 0.02 },
    taglineFont: { family: "Lato", weight: 400, letterSpacing: 0.22 },
  },
  {
    id: "poppins-inter",
    name: "Friendly Geometric",
    tags: ["friendly", "playful", "consumer", "app"],
    nameFont: { family: "Poppins", weight: 600, letterSpacing: 0 },
    taglineFont: { family: "Inter", weight: 400, letterSpacing: 0.14 },
  },
  {
    id: "montserrat-opensans",
    name: "Confident Sans",
    tags: ["corporate", "confident", "agency", "versatile"],
    nameFont: { family: "Montserrat", weight: 800, letterSpacing: 0.04 },
    taglineFont: { family: "Open Sans", weight: 400, letterSpacing: 0.18 },
  },
  {
    id: "dmserif-dmsans",
    name: "Refined Contrast",
    tags: ["boutique", "premium", "refined", "fashion"],
    nameFont: { family: "DM Serif Display", weight: 400, letterSpacing: 0.01 },
    taglineFont: { family: "DM Sans", weight: 400, letterSpacing: 0.2 },
  },
  {
    id: "archivo-roboto",
    name: "Bold Industrial",
    tags: ["bold", "industrial", "sports", "automotive"],
    nameFont: { family: "Archivo Black", weight: 400, letterSpacing: 0.01 },
    taglineFont: { family: "Roboto", weight: 500, letterSpacing: 0.16 },
  },
  {
    id: "lobster-sourcesans",
    name: "Handwritten Charm",
    tags: ["handmade", "cafe", "food", "warm"],
    nameFont: { family: "Lobster", weight: 400, letterSpacing: 0.01 },
    taglineFont: { family: "Source Sans 3", weight: 400, letterSpacing: 0.14 },
  },
  {
    id: "pacifico-nunito",
    name: "Casual Script",
    tags: ["casual", "creative", "kids", "playful"],
    nameFont: { family: "Pacifico", weight: 400, letterSpacing: 0 },
    taglineFont: { family: "Nunito", weight: 600, letterSpacing: 0.12 },
  },
  {
    id: "cormorant-montserrat",
    name: "High Fashion",
    tags: ["fashion", "luxury", "beauty", "minimal"],
    nameFont: { family: "Cormorant Garamond", weight: 600, letterSpacing: 0.08 },
    taglineFont: { family: "Montserrat", weight: 400, letterSpacing: 0.3 },
  },
  {
    id: "raleway-merriweather",
    name: "Thin Elegance",
    tags: ["architecture", "elegant", "interior", "studio"],
    nameFont: { family: "Raleway", weight: 600, letterSpacing: 0.1 },
    taglineFont: { family: "Merriweather", weight: 400, letterSpacing: 0.08 },
  },
  {
    id: "bebas-inter",
    name: "Condensed Impact",
    tags: ["sports", "fitness", "bold", "events"],
    nameFont: { family: "Bebas Neue", weight: 400, letterSpacing: 0.06 },
    taglineFont: { family: "Inter", weight: 500, letterSpacing: 0.2 },
  },
  {
    id: "fraunces-worksans",
    name: "Warm Editorial",
    tags: ["food", "organic", "editorial", "warm"],
    nameFont: { family: "Fraunces", weight: 600, letterSpacing: 0 },
    taglineFont: { family: "Work Sans", weight: 400, letterSpacing: 0.16 },
  },
  {
    id: "orbitron-exo",
    name: "Future Tech",
    tags: ["gaming", "tech", "futuristic", "science"],
    nameFont: { family: "Orbitron", weight: 700, letterSpacing: 0.08 },
    taglineFont: { family: "Exo 2", weight: 400, letterSpacing: 0.18 },
  },
  {
    id: "abril-lato",
    name: "Statement Serif",
    tags: ["media", "magazine", "bold", "creative"],
    nameFont: { family: "Abril Fatface", weight: 400, letterSpacing: 0.01 },
    taglineFont: { family: "Lato", weight: 400, letterSpacing: 0.18 },
  },
  {
    id: "quicksand-mulish",
    name: "Soft Rounded",
    tags: ["wellness", "care", "soft", "health"],
    nameFont: { family: "Quicksand", weight: 700, letterSpacing: 0.02 },
    taglineFont: { family: "Mulish", weight: 400, letterSpacing: 0.14 },
  },
  {
    id: "rubik-karla",
    name: "Approachable Sans",
    tags: ["app", "consumer", "friendly", "modern"],
    nameFont: { family: "Rubik", weight: 700, letterSpacing: 0 },
    taglineFont: { family: "Karla", weight: 400, letterSpacing: 0.14 },
  },
  {
    id: "marcellus-jost",
    name: "Classical Roman",
    tags: ["legal", "finance", "classic", "trust"],
    nameFont: { family: "Marcellus", weight: 400, letterSpacing: 0.08 },
    taglineFont: { family: "Jost", weight: 400, letterSpacing: 0.22 },
  },
  {
    id: "caveat-worksans",
    name: "Personal Touch",
    tags: ["personal", "blog", "craft", "handmade"],
    nameFont: { family: "Caveat", weight: 700, letterSpacing: 0 },
    taglineFont: { family: "Work Sans", weight: 400, letterSpacing: 0.12 },
  },
  {
    id: "sora-inter",
    name: "Crisp Startup",
    tags: ["saas", "startup", "fintech", "crisp"],
    nameFont: { family: "Sora", weight: 700, letterSpacing: -0.01 },
    taglineFont: { family: "Inter", weight: 400, letterSpacing: 0.16 },
  },
  {
    id: "alfa-publicsans",
    name: "Retro Slab",
    tags: ["retro", "vintage", "barber", "brewery"],
    nameFont: { family: "Alfa Slab One", weight: 400, letterSpacing: 0.02 },
    taglineFont: { family: "Public Sans", weight: 500, letterSpacing: 0.18 },
  },
  {
    id: "josefin-cabin",
    name: "Vintage Geometric",
    tags: ["vintage", "boutique", "photography", "art"],
    nameFont: { family: "Josefin Sans", weight: 600, letterSpacing: 0.1 },
    taglineFont: { family: "Cabin", weight: 400, letterSpacing: 0.16 },
  },
  {
    id: "manrope-ibmplex",
    name: "Data Forward",
    tags: ["analytics", "data", "ai", "tech"],
    nameFont: { family: "Manrope", weight: 800, letterSpacing: -0.01 },
    taglineFont: { family: "IBM Plex Sans", weight: 400, letterSpacing: 0.14 },
  },
  {
    id: "yeseva-josefin",
    name: "Ornate Display",
    tags: ["beauty", "floral", "wedding", "events"],
    nameFont: { family: "Yeseva One", weight: 400, letterSpacing: 0.02 },
    taglineFont: { family: "Josefin Sans", weight: 400, letterSpacing: 0.2 },
  },
  {
    id: "chivo-spacemono",
    name: "Technical Mono",
    tags: ["developer", "engineering", "technical", "minimal"],
    nameFont: { family: "Chivo", weight: 700, letterSpacing: 0 },
    taglineFont: { family: "Space Mono", weight: 400, letterSpacing: 0.1 },
  },
];

export function getFontPairing(id: string): FontPairing | undefined {
  return FONT_PAIRINGS.find((p) => p.id === id);
}

/** All unique families used across pairings (for font preloading). */
export const FONT_FAMILIES: string[] = [
  ...new Set(
    FONT_PAIRINGS.flatMap((p) => [p.nameFont.family, p.taglineFont.family]),
  ),
];

/** Build a Google Fonts CSS2 URL covering the given families. */
export function googleFontsUrl(families: string[] = FONT_FAMILIES): string {
  const params = families
    .map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700;800;900`)
    .join("&");
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}
