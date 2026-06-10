import type { Palette } from "./types";

export interface CuratedPalette extends Palette {
  id: string;
  name: string;
  tags: string[];
}

export const PALETTES: CuratedPalette[] = [
  { id: "midnight", name: "Midnight", tags: ["tech", "premium", "trust"], primary: "#4F6BFF", secondary: "#9DAFFF", text: "#10172A", background: "#FFFFFF" },
  { id: "forest", name: "Forest", tags: ["eco", "organic", "calm"], primary: "#2E7D5B", secondary: "#8FD3B2", text: "#15301F", background: "#F7FBF4" },
  { id: "ember", name: "Ember", tags: ["food", "bold", "energy"], primary: "#E2522F", secondary: "#FFB35C", text: "#33150D", background: "#FFF8F2" },
  { id: "orchid", name: "Orchid", tags: ["beauty", "creative", "playful"], primary: "#9B5CF6", secondary: "#F0ABFC", text: "#2C1450", background: "#FDFAFF" },
  { id: "ocean", name: "Ocean", tags: ["travel", "water", "fresh"], primary: "#0E8FAE", secondary: "#7FD8E8", text: "#0B2C36", background: "#F4FBFC" },
  { id: "noir", name: "Noir", tags: ["luxury", "minimal", "fashion"], primary: "#17181C", secondary: "#B9A06A", text: "#17181C", background: "#FAF9F6" },
  { id: "sunrise", name: "Sunrise", tags: ["optimism", "wellness", "warm"], primary: "#F4793B", secondary: "#FFD166", text: "#3B2310", background: "#FFFBF3" },
  { id: "berry", name: "Berry", tags: ["bold", "media", "events"], primary: "#C2255C", secondary: "#FF8FAB", text: "#3A0B1F", background: "#FFF6F9" },
  { id: "slate", name: "Slate", tags: ["corporate", "legal", "trust"], primary: "#33485E", secondary: "#7E97B0", text: "#1C2935", background: "#F6F8FA" },
  { id: "lime", name: "Lime", tags: ["fitness", "energy", "fresh"], primary: "#5BA823", secondary: "#C3EC5E", text: "#1D3309", background: "#FAFEF2" },
  { id: "cocoa", name: "Cocoa", tags: ["coffee", "craft", "warm"], primary: "#6B4226", secondary: "#D9A05B", text: "#2E1B0E", background: "#FBF6EF" },
  { id: "neon-night", name: "Neon Night", tags: ["gaming", "futuristic", "tech"], primary: "#0FCFC4", secondary: "#9B7BFF", text: "#F4F7FA", background: "#101522" },
  { id: "ruby-dark", name: "Ruby Dark", tags: ["bold", "entertainment", "premium"], primary: "#FF4757", secondary: "#FFA8B0", text: "#FDF2F3", background: "#1B1118" },
  { id: "gold-dark", name: "Gilded", tags: ["luxury", "finance", "premium"], primary: "#D4AF37", secondary: "#F4E2A6", text: "#F5F1E6", background: "#14130E" },
  { id: "sky", name: "Sky", tags: ["health", "care", "calm"], primary: "#3D9BE9", secondary: "#A8D8FF", text: "#10293D", background: "#F5FAFF" },
  { id: "terracotta", name: "Terracotta", tags: ["interior", "craft", "earthy"], primary: "#C06043", secondary: "#E8B298", text: "#36190E", background: "#FBF4EF" },
];

export function getPalette(id: string): CuratedPalette | undefined {
  return PALETTES.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// Color utilities

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((ch) => ch + ch).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) =>
    Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}

export function hexToHsl(hex: string): [number, number, number] {
  let [r, g, b] = hexToRgb(hex);
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h * 360, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
  };
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

export function isDark(hex: string): boolean {
  const [r, g, b] = hexToRgb(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 140;
}

export function lighten(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.min(1, l + amount));
}

export function darken(hex: string, amount: number): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, s, Math.max(0, l - amount));
}

/** Build a full palette from one seed brand color. */
export function paletteFromSeed(seed: string): Palette {
  const [h, s] = hexToHsl(seed);
  const secondary = hslToHex(h + 28, Math.min(1, s * 0.95 + 0.05), 0.74);
  const text = hslToHex(h, Math.min(0.6, s), 0.13);
  return { primary: seed, secondary, text, background: "#FFFFFF" };
}

/** Suggest harmonious alternatives for a given brand color. */
export function suggestHarmonies(seed: string): string[] {
  const [h, s, l] = hexToHsl(seed);
  const cl = Math.min(0.62, Math.max(0.32, l));
  return [
    hslToHex(h + 180, s, cl),
    hslToHex(h + 30, s, cl),
    hslToHex(h - 30, s, cl),
    hslToHex(h + 120, s, cl),
    hslToHex(h, Math.min(1, s + 0.25), Math.max(0.25, cl - 0.15)),
    hslToHex(h, Math.max(0.1, s - 0.3), Math.min(0.7, cl + 0.15)),
  ];
}
