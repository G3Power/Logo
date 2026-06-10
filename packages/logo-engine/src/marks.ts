import type { MarkStyle } from "./types";

export interface MarkColors {
  primary: string;
  secondary: string;
}

export interface MarkDef {
  id: string;
  name: string;
  /** Searchable tags, including industry hints. */
  tags: string[];
  /** Returns SVG elements within a 0 0 100 100 viewBox. */
  render: (colors: MarkColors, style: MarkStyle) => string;
}

const STROKE_WIDTH = 7;

function polygonPoints(
  sides: number,
  cx: number,
  cy: number,
  r: number,
  rotationDeg = -90,
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`);
  }
  return pts.join(" ");
}

function attrs(style: MarkStyle, color: string, opacity?: number): string {
  const parts: string[] = [];
  if (style === "outline") {
    parts.push(
      `fill="none" stroke="${color}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"`,
    );
  } else {
    parts.push(`fill="${color}"`);
  }
  if (opacity !== undefined && opacity < 1) parts.push(`opacity="${opacity}"`);
  return parts.join(" ");
}

/** Pick the color for the i-th layer of a mark given the mark style. */
function layerColor(style: MarkStyle, colors: MarkColors, layer: 0 | 1): string {
  if (style === "duotone") return layer === 0 ? colors.primary : colors.secondary;
  return colors.primary;
}

function circle(cx: number, cy: number, r: number, a: string): string {
  return `<circle cx="${cx}" cy="${cy}" r="${r}" ${a}/>`;
}

function rect(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  a: string,
): string {
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ${a}/>`;
}

function poly(points: string, a: string): string {
  return `<polygon points="${points}" ${a}/>`;
}

function path(d: string, a: string): string {
  return `<path d="${d}" ${a}/>`;
}

export const MARKS: MarkDef[] = [
  {
    id: "orbit",
    name: "Orbit",
    tags: ["tech", "science", "space", "modern"],
    render: (c, s) =>
      circle(50, 50, 24, attrs(s, layerColor(s, c, 0))) +
      `<circle cx="50" cy="50" r="40" fill="none" stroke="${layerColor(s, c, 1)}" stroke-width="${STROKE_WIDTH}" stroke-dasharray="44 18" stroke-linecap="round" transform="rotate(-30 50 50)"/>`,
  },
  {
    id: "spark",
    name: "Spark",
    tags: ["energy", "creative", "bold", "marketing"],
    render: (c, s) =>
      path(
        "M50 6 L60 38 L94 50 L60 62 L50 94 L40 62 L6 50 L40 38 Z",
        attrs(s, layerColor(s, c, 0)),
      ) + circle(50, 50, 9, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))),
  },
  {
    id: "wave",
    name: "Wave",
    tags: ["water", "flow", "travel", "calm", "wellness"],
    render: (c, s) => {
      const w = (y: number, color: string, o?: number) =>
        `<path d="M8 ${y} Q 29 ${y - 22} 50 ${y} T 92 ${y}" fill="none" stroke="${color}" stroke-width="${STROKE_WIDTH + 2}" stroke-linecap="round"${o ? ` opacity="${o}"` : ""}/>`;
      return (
        w(40, layerColor(s, c, 0)) +
        w(62, layerColor(s, c, 1), s === "duotone" ? 1 : 0.55) +
        w(84, layerColor(s, c, 0), 0.3)
      );
    },
  },
  {
    id: "leaf",
    name: "Leaf",
    tags: ["nature", "organic", "eco", "food", "wellness"],
    render: (c, s) =>
      path(
        "M50 8 C 84 22 92 60 50 92 C 8 60 16 22 50 8 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      `<path d="M50 24 L50 80 M50 44 L34 36 M50 60 L66 50" fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: "bolt",
    name: "Bolt",
    tags: ["energy", "speed", "power", "fitness", "sports"],
    render: (c, s) =>
      path("M56 6 L22 56 L46 56 L40 94 L78 40 L52 40 Z", attrs(s, layerColor(s, c, 0))),
  },
  {
    id: "peak",
    name: "Peak",
    tags: ["outdoors", "adventure", "finance", "growth", "consulting"],
    render: (c, s) =>
      poly("12,82 42,26 60,58 72,40 92,82", attrs(s, layerColor(s, c, 0))) +
      circle(76, 22, 9, attrs(s, layerColor(s, c, 1))),
  },
  {
    id: "hex-stack",
    name: "Hex Stack",
    tags: ["tech", "engineering", "industrial", "blockchain"],
    render: (c, s) =>
      poly(polygonPoints(6, 50, 50, 42), attrs(s, layerColor(s, c, 0))) +
      poly(polygonPoints(6, 50, 50, 22), attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))),
  },
  {
    id: "rings",
    name: "Rings",
    tags: ["community", "partnership", "social", "union"],
    render: (c, s) => {
      const sw = STROKE_WIDTH + 2;
      return (
        `<circle cx="38" cy="50" r="26" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${sw}"/>` +
        `<circle cx="62" cy="50" r="26" fill="none" stroke="${layerColor(s, c, 1)}" stroke-width="${sw}" opacity="${s === "duotone" ? 1 : 0.55}"/>`
      );
    },
  },
  {
    id: "bloom",
    name: "Bloom",
    tags: ["beauty", "floral", "creative", "boutique", "wellness"],
    render: (c, s) => {
      let petals = "";
      for (let i = 0; i < 6; i++) {
        petals += `<ellipse cx="50" cy="28" rx="13" ry="24" ${attrs(s, layerColor(s, c, 0), 0.85)} transform="rotate(${i * 60} 50 50)"/>`;
      }
      return petals + circle(50, 50, 10, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1)));
    },
  },
  {
    id: "arrow-up",
    name: "Ascent",
    tags: ["finance", "growth", "startup", "analytics"],
    render: (c, s) =>
      path(
        "M14 78 L42 48 L58 62 L86 28",
        `fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH + 2}" stroke-linecap="round" stroke-linejoin="round"`,
      ) + path("M64 24 L88 24 L88 48 Z", attrs(s, layerColor(s, c, 1))),
  },
  {
    id: "cube",
    name: "Cube",
    tags: ["tech", "logistics", "3d", "product"],
    render: (c, s) =>
      poly("50,8 88,30 88,70 50,92 12,70 12,30", attrs(s, layerColor(s, c, 0))) +
      `<path d="M50 8 L50 50 M12 30 L50 50 M88 30 L50 50" fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="5" stroke-linejoin="round"/>`,
  },
  {
    id: "shutter",
    name: "Shutter",
    tags: ["photography", "media", "creative", "video"],
    render: (c, s) => {
      let blades = "";
      for (let i = 0; i < 6; i++) {
        blades += `<path d="M50 50 L50 10 A40 40 0 0 1 84.6 30 Z" ${attrs(s, layerColor(s, c, i % 2 === 0 ? 0 : 1), 0.9)} transform="rotate(${i * 60} 50 50)"/>`;
      }
      return blades;
    },
  },
  {
    id: "chat",
    name: "Chat",
    tags: ["communication", "social", "support", "community"],
    render: (c, s) =>
      path(
        "M14 22 H86 A8 8 0 0 1 94 30 V64 A8 8 0 0 1 86 72 H46 L26 90 V72 H14 A8 8 0 0 1 6 64 V30 A8 8 0 0 1 14 22 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      [30, 50, 70]
        .map((x) => circle(x, 47, 5, attrs("solid", s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1))))
        .join(""),
  },
  {
    id: "compass",
    name: "Compass",
    tags: ["travel", "adventure", "guidance", "consulting"],
    render: (c, s) =>
      circle(50, 50, 42, attrs(s === "solid" ? "outline" : s, layerColor(s, c, 0))) +
      poly("50,18 60,50 50,82 40,50", attrs(s, layerColor(s, c, 1))),
  },
  {
    id: "heart-pulse",
    name: "Vital",
    tags: ["health", "medical", "fitness", "care"],
    render: (c, s) =>
      path(
        "M50 88 C 18 64 8 44 16 28 C 23 15 42 14 50 30 C 58 14 77 15 84 28 C 92 44 82 64 50 88 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      path(
        "M22 52 H38 L46 38 L56 64 L62 52 H78",
        `fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"`,
      ),
  },
  {
    id: "stack",
    name: "Layers",
    tags: ["software", "platform", "data", "saas"],
    render: (c, s) =>
      poly("50,10 90,30 50,50 10,30", attrs(s, layerColor(s, c, 0))) +
      poly("50,38 90,58 50,78 10,58", attrs(s, layerColor(s, c, 1), 0.85)) +
      poly("50,66 90,86 50,106 10,86", attrs(s, layerColor(s, c, 0), 0.55)),
  },
  {
    id: "flame",
    name: "Flame",
    tags: ["food", "energy", "hot", "bold", "restaurant"],
    render: (c, s) =>
      path(
        "M50 6 C 62 26 80 36 80 60 A30 30 0 0 1 20 60 C 20 42 34 32 38 18 C 42 28 48 30 50 6 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      path(
        "M50 50 C 56 60 62 62 62 72 A12 12 0 0 1 38 72 C 38 64 46 60 50 50 Z",
        attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1)),
      ),
  },
  {
    id: "book",
    name: "Folio",
    tags: ["education", "publishing", "writing", "legal"],
    render: (c, s) =>
      path(
        "M50 22 C 40 14 24 12 10 14 V 80 C 24 78 40 80 50 88 C 60 80 76 78 90 80 V 14 C 76 12 60 14 50 22 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      `<path d="M50 24 V 86" fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="5"/>`,
  },
  {
    id: "diamond",
    name: "Facet",
    tags: ["luxury", "jewelry", "premium", "boutique"],
    render: (c, s) =>
      poly("28,14 72,14 92,40 50,90 8,40", attrs(s, layerColor(s, c, 0))) +
      `<path d="M28 14 L50 40 L72 14 M8 40 H92 M50 40 L50 90" fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="4" stroke-linejoin="round"/>`,
  },
  {
    id: "globe",
    name: "Globe",
    tags: ["global", "travel", "logistics", "international"],
    render: (c, s) => {
      const stroke = s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1);
      return (
        circle(50, 50, 42, attrs(s === "solid" ? "solid" : "outline", layerColor(s, c, 0))) +
        `<ellipse cx="50" cy="50" rx="20" ry="42" fill="none" stroke="${stroke}" stroke-width="4.5"/>` +
        `<path d="M8 50 H92 M14 28 H86 M14 72 H86" fill="none" stroke="${stroke}" stroke-width="4.5"/>`
      );
    },
  },
  {
    id: "pin",
    name: "Locale",
    tags: ["local", "real estate", "travel", "events"],
    render: (c, s) =>
      path(
        "M50 6 A32 32 0 0 1 82 38 C 82 62 50 94 50 94 C 50 94 18 62 18 38 A32 32 0 0 1 50 6 Z",
        attrs(s, layerColor(s, c, 0)),
      ) + circle(50, 38, 12, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))),
  },
  {
    id: "cup",
    name: "Brew",
    tags: ["coffee", "cafe", "food", "hospitality"],
    render: (c, s) =>
      path(
        "M18 34 H70 V62 A26 26 0 0 1 18 62 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      path(
        "M70 40 H80 A10 10 0 0 1 80 60 H70",
        attrs("outline", layerColor(s, c, 0)),
      ) +
      `<path d="M32 24 C 30 18 34 16 32 10 M46 24 C 44 18 48 16 46 10" fill="none" stroke="${layerColor(s, c, 1)}" stroke-width="5" stroke-linecap="round"/>`,
  },
  {
    id: "camera",
    name: "Lens",
    tags: ["photography", "media", "video"],
    render: (c, s) =>
      rect(8, 26, 84, 56, 10, attrs(s, layerColor(s, c, 0))) +
      path("M34 26 L40 14 H60 L66 26", attrs(s, layerColor(s, c, 0))) +
      circle(50, 54, 17, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))) +
      (s === "outline" ? "" : circle(50, 54, 8, attrs("solid", layerColor(s, c, 0)))),
  },
  {
    id: "paw",
    name: "Paw",
    tags: ["pets", "animals", "vet", "care"],
    render: (c, s) =>
      path(
        "M50 48 C 64 48 76 60 76 74 A 14 14 0 0 1 58 86 C 53 84 47 84 42 86 A 14 14 0 0 1 24 74 C 24 60 36 48 50 48 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      [
        [28, 38],
        [44, 26],
        [60, 26],
        [74, 38],
      ]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="8" ry="10" ${attrs(s, layerColor(s, c, 1))}/>`)
        .join(""),
  },
  {
    id: "scale",
    name: "Balance",
    tags: ["legal", "law", "finance", "justice"],
    render: (c, s) => {
      const stroke = `fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="6" stroke-linecap="round"`;
      return (
        `<path d="M50 14 V 78 M26 26 H74 M34 86 H66" ${stroke}/>` +
        path("M14 56 A12 12 0 0 0 38 56 L26 30 Z", attrs(s, layerColor(s, c, 1))) +
        path("M62 56 A12 12 0 0 0 86 56 L74 30 Z", attrs(s, layerColor(s, c, 1)))
      );
    },
  },
  {
    id: "infinity",
    name: "Loop",
    tags: ["tech", "continuous", "agency", "modern"],
    render: (c, s) =>
      `<path d="M50 50 C 38 32 12 32 12 50 C 12 68 38 68 50 50 C 62 32 88 32 88 50 C 88 68 62 68 50 50 Z" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH + 2}" stroke-linecap="round"/>`,
  },
  {
    id: "north-star",
    name: "North Star",
    tags: ["guidance", "premium", "consulting", "minimal"],
    render: (c, s) =>
      path("M50 4 C 54 32 58 36 86 40 C 58 44 54 48 50 76 C 46 48 42 44 14 40 C 42 36 46 32 50 4 Z", attrs(s, layerColor(s, c, 0))) +
      path("M74 62 C 76 74 78 76 90 78 C 78 80 76 82 74 94 C 72 82 70 80 58 78 C 70 76 72 74 74 62 Z", attrs(s, layerColor(s, c, 1))),
  },
  {
    id: "gear",
    name: "Gear",
    tags: ["engineering", "industrial", "automotive", "manufacturing"],
    render: (c, s) => {
      let teeth = "";
      for (let i = 0; i < 8; i++) {
        teeth += `<rect x="44" y="4" width="12" height="16" rx="4" ${attrs(s, layerColor(s, c, 0))} transform="rotate(${i * 45} 50 50)"/>`;
      }
      return (
        teeth +
        circle(50, 50, 28, attrs(s, layerColor(s, c, 0))) +
        circle(50, 50, 12, s === "outline" ? attrs("outline", layerColor(s, c, 0)) : attrs("solid", layerColor(s, c, 1)))
      );
    },
  },
  {
    id: "play",
    name: "Play",
    tags: ["media", "video", "entertainment", "music"],
    render: (c, s) =>
      rect(8, 8, 84, 84, 24, attrs(s, layerColor(s, c, 0))) +
      poly("40,32 72,50 40,68", attrs(s === "outline" ? "outline" : "solid", s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1))),
  },
  {
    id: "sprout",
    name: "Sprout",
    tags: ["startup", "eco", "agriculture", "growth"],
    render: (c, s) =>
      `<path d="M50 92 V 48" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round"/>` +
      path("M50 52 C 50 30 34 18 12 18 C 12 40 28 52 50 52 Z", attrs(s, layerColor(s, c, 0))) +
      path("M50 60 C 50 44 62 34 88 34 C 88 52 74 60 50 60 Z", attrs(s, layerColor(s, c, 1))),
  },
  {
    id: "key",
    name: "Key",
    tags: ["real estate", "security", "access", "finance"],
    render: (c, s) =>
      circle(34, 34, 22, attrs(s === "solid" ? "outline" : s, layerColor(s, c, 0))) +
      `<path d="M48 48 L84 84 M70 70 L80 60 M58 58 L68 48" fill="none" stroke="${layerColor(s, c, 1)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round"/>`,
  },
  {
    id: "sun",
    name: "Solar",
    tags: ["energy", "wellness", "travel", "optimism"],
    render: (c, s) => {
      let rays = "";
      for (let i = 0; i < 8; i++) {
        rays += `<line x1="50" y1="6" x2="50" y2="20" stroke="${layerColor(s, c, 1)}" stroke-width="6" stroke-linecap="round" transform="rotate(${i * 45} 50 50)"/>`;
      }
      return rays + circle(50, 50, 22, attrs(s, layerColor(s, c, 0)));
    },
  },
  {
    id: "moon",
    name: "Lunar",
    tags: ["sleep", "calm", "night", "wellness", "minimal"],
    render: (c, s) =>
      path("M64 8 A 42 42 0 1 0 92 64 A 34 34 0 0 1 64 8 Z", attrs(s, layerColor(s, c, 0))) +
      circle(68, 30, 5, attrs("solid", layerColor(s, c, 1))) +
      circle(80, 46, 3.5, attrs("solid", layerColor(s, c, 1))),
  },
  {
    id: "fork-knife",
    name: "Table",
    tags: ["restaurant", "food", "hospitality", "catering"],
    render: (c, s) => {
      const stroke = (color: string) =>
        `fill="none" stroke="${color}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round"`;
      return (
        `<path d="M30 8 V 36 M20 8 V 32 A10 10 0 0 0 40 32 V 8 M30 44 V 92" ${stroke(layerColor(s, c, 0))}/>` +
        `<path d="M70 92 V 8 C 58 14 56 34 58 48 H 70" ${stroke(layerColor(s, c, 1))}/>`
      );
    },
  },
  {
    id: "code",
    name: "Code",
    tags: ["software", "developer", "tech", "agency"],
    render: (c, s) =>
      `<path d="M32 28 L10 50 L32 72" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH + 1}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M68 28 L90 50 L68 72" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH + 1}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<line x1="57" y1="22" x2="43" y2="78" stroke="${layerColor(s, c, 1)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round"/>`,
  },
  {
    id: "palette",
    name: "Palette",
    tags: ["art", "design", "creative", "studio"],
    render: (c, s) =>
      path(
        "M50 8 A 42 42 0 1 0 50 92 C 60 92 60 82 56 76 C 52 70 56 62 64 62 H 76 C 86 62 92 54 92 44 C 90 22 72 8 50 8 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      [
        [32, 32],
        [56, 26],
        [26, 56],
      ]
        .map(([x, y]) => circle(x!, y!, 6, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))))
        .join(""),
  },
  {
    id: "shield-check",
    name: "Guard",
    tags: ["security", "insurance", "trust", "finance"],
    render: (c, s) =>
      path(
        "M50 6 L86 20 V 48 C 86 70 72 86 50 94 C 28 86 14 70 14 48 V 20 Z",
        attrs(s, layerColor(s, c, 0)),
      ) +
      `<path d="M34 50 L46 62 L68 36" fill="none" stroke="${s === "outline" ? layerColor(s, c, 0) : layerColor(s, c, 1)}" stroke-width="${STROKE_WIDTH + 1}" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  {
    id: "house",
    name: "Haven",
    tags: ["real estate", "home", "construction", "interior"],
    render: (c, s) =>
      path("M50 10 L92 46 H80 V 88 H20 V 46 H8 Z", attrs(s, layerColor(s, c, 0))) +
      rect(42, 60, 16, 28, 3, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1))),
  },
  {
    id: "note",
    name: "Note",
    tags: ["music", "audio", "entertainment", "podcast"],
    render: (c, s) =>
      `<path d="M38 78 V 18 L 82 10 V 68" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<ellipse cx="28" cy="78" rx="12" ry="10" ${attrs(s, layerColor(s, c, 1))}/>` +
      `<ellipse cx="72" cy="68" rx="12" ry="10" ${attrs(s, layerColor(s, c, 1))}/>`,
  },
  {
    id: "atom",
    name: "Atom",
    tags: ["science", "research", "lab", "education"],
    render: (c, s) => {
      const orbit = (rot: number) =>
        `<ellipse cx="50" cy="50" rx="42" ry="17" fill="none" stroke="${layerColor(s, c, 0)}" stroke-width="5" transform="rotate(${rot} 50 50)"/>`;
      return orbit(0) + orbit(60) + orbit(120) + circle(50, 50, 9, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 1)));
    },
  },
  {
    id: "dumbbell",
    name: "Iron",
    tags: ["fitness", "gym", "sports", "strength"],
    render: (c, s) =>
      `<line x1="30" y1="50" x2="70" y2="50" stroke="${layerColor(s, c, 1)}" stroke-width="9" stroke-linecap="round"/>` +
      rect(14, 28, 14, 44, 6, attrs(s, layerColor(s, c, 0))) +
      rect(72, 28, 14, 44, 6, attrs(s, layerColor(s, c, 0))) +
      rect(2, 38, 9, 24, 4, attrs(s, layerColor(s, c, 0), 0.7)) +
      rect(89, 38, 9, 24, 4, attrs(s, layerColor(s, c, 0), 0.7)),
  },
  {
    id: "scissors",
    name: "Snip",
    tags: ["salon", "barber", "fashion", "craft"],
    render: (c, s) =>
      circle(26, 70, 12, attrs(s === "solid" ? "outline" : s, layerColor(s, c, 0))) +
      circle(26, 30, 12, attrs(s === "solid" ? "outline" : s, layerColor(s, c, 0))) +
      `<path d="M36 62 L88 28 M36 38 L88 72" fill="none" stroke="${layerColor(s, c, 1)}" stroke-width="${STROKE_WIDTH}" stroke-linecap="round"/>`,
  },
  {
    id: "truck",
    name: "Hauler",
    tags: ["logistics", "delivery", "transport", "moving"],
    render: (c, s) =>
      rect(6, 28, 52, 36, 6, attrs(s, layerColor(s, c, 0))) +
      path("M58 40 H 80 L 92 54 V 64 H 58 Z", attrs(s, layerColor(s, c, 1))) +
      circle(26, 72, 9, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 0))) +
      circle(74, 72, 9, attrs(s === "outline" ? "outline" : "solid", layerColor(s, c, 0))),
  },
];

export const MARK_IDS = MARKS.map((m) => m.id);

export function getMark(id: string): MarkDef | undefined {
  return MARKS.find((m) => m.id === id);
}

export function searchMarks(query: string): MarkDef[] {
  const q = query.trim().toLowerCase();
  if (!q) return MARKS;
  return MARKS.filter(
    (m) =>
      m.id.includes(q) ||
      m.name.toLowerCase().includes(q) ||
      m.tags.some((t) => t.includes(q)),
  );
}
