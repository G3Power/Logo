import { getMark } from "./marks";
import { isDark, darken, lighten } from "./palettes";
import { fontAttrs, getInitials } from "./renderer";
import type { AppIconSpec, FontSpec, LogoSpec } from "./types";

/**
 * Derive a sensible app icon from a logo: mark-only when the logo has a
 * distinct mark, monogram otherwise, on a brand-colored background.
 */
export function deriveIconSpec(logo: LogoSpec): AppIconSpec {
  const hasMark = Boolean(logo.rasterMarkUrl) || (logo.markId !== "monogram" && Boolean(getMark(logo.markId)));
  const bg = logo.palette.primary;
  const fg = isDark(bg) ? "#FFFFFF" : darken(bg, 0.42);
  return {
    content: hasMark ? "mark" : "monogram",
    markId: logo.markId,
    markStyle: logo.markStyle,
    monogram: getInitials(logo.brandName).toUpperCase(),
    backgroundStyle: "gradient",
    backgroundColor: bg,
    backgroundColorEnd: darken(bg, 0.14),
    foregroundColor: fg,
    accentColor: isDark(bg) ? lighten(logo.palette.secondary, 0.1) : logo.palette.secondary,
    cornerRadius: 0.224,
    glyphScale: 0.58,
    fontFamily: logo.nameFont.family,
    fontWeight: 700,
    rasterMarkUrl: logo.rasterMarkUrl,
  };
}

export interface AppIconRenderOptions {
  /** Output pixel size (square). Default 1024. */
  size?: number;
  /**
   * - "full": rounded-square preview (marketing / master icon)
   * - "square": full-bleed square (iOS masters, Android adaptive layers)
   * - "circle": circular preview (Android launcher preview)
   */
  shape?: "full" | "square" | "circle";
  /** Render only the foreground glyph on transparent (Android adaptive fg). */
  foregroundOnly?: boolean;
  /** Emit React Native compatible font names (see RenderOptions). */
  nativeFontNames?: boolean;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Render an AppIconSpec to a standalone SVG string. */
export function renderAppIconSvg(spec: AppIconSpec, options: AppIconRenderOptions = {}): string {
  const size = options.size ?? 1024;
  const shape = options.shape ?? "full";
  const V = 1024; // internal viewBox

  const gradId = `bg${Math.abs(hashCode(spec.backgroundColor + spec.backgroundColorEnd))}`;
  let defs = "";
  let bgFill = spec.backgroundColor;
  if (spec.backgroundStyle === "gradient" && !options.foregroundOnly) {
    defs = `<linearGradient id="${gradId}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${spec.backgroundColor}"/><stop offset="1" stop-color="${spec.backgroundColorEnd}"/></linearGradient>`;
    bgFill = `url(#${gradId})`;
  }

  let bgShape = "";
  if (!options.foregroundOnly) {
    switch (shape) {
      case "full": {
        const rx = V * spec.cornerRadius;
        bgShape = `<rect width="${V}" height="${V}" rx="${rx}" fill="${bgFill}"/>`;
        break;
      }
      case "square":
        bgShape = `<rect width="${V}" height="${V}" fill="${bgFill}"/>`;
        break;
      case "circle":
        bgShape = `<circle cx="${V / 2}" cy="${V / 2}" r="${V / 2}" fill="${bgFill}"/>`;
        break;
      default: {
        const exhaustive: never = shape;
        throw new Error(`Unknown icon shape: ${String(exhaustive)}`);
      }
    }
  }

  // Adaptive foregrounds get a tighter glyph so launcher masks don't clip it.
  const glyphScale = options.foregroundOnly ? spec.glyphScale * 0.66 : spec.glyphScale;
  const glyphSize = V * glyphScale;
  const gx = (V - glyphSize) / 2;

  let glyph: string;
  if (spec.content === "mark" && spec.rasterMarkUrl) {
    glyph = `<image href="${escapeXml(spec.rasterMarkUrl)}" x="${gx}" y="${gx}" width="${glyphSize}" height="${glyphSize}" preserveAspectRatio="xMidYMid meet"/>`;
  } else if (spec.content === "mark" && getMark(spec.markId)) {
    const mark = getMark(spec.markId)!;
    const inner = mark.render(
      { primary: spec.foregroundColor, secondary: spec.accentColor },
      spec.markStyle,
    );
    glyph = `<g transform="translate(${gx} ${gx}) scale(${(glyphSize / 100).toFixed(4)})">${inner}</g>`;
  } else {
    const fontSize = glyphSize * (spec.monogram.length > 1 ? 0.62 : 0.85);
    const font: FontSpec = { family: spec.fontFamily, weight: spec.fontWeight, letterSpacing: 0 };
    glyph =
      `<text x="${V / 2}" y="${V / 2}" ${fontAttrs(font, options.nativeFontNames ?? false)} ` +
      `font-size="${fontSize.toFixed(0)}" fill="${spec.foregroundColor}" ` +
      `text-anchor="middle" dominant-baseline="central">${escapeXml(spec.monogram)}</text>`;
  }

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${V} ${V}">` +
    (defs ? `<defs>${defs}</defs>` : "") +
    bgShape +
    glyph +
    `</svg>`
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

/** Standard export targets for icon packs. */
export const ICON_EXPORT_TARGETS = [
  { id: "master", label: "Master 1024", size: 1024, shape: "full" as const },
  { id: "ios-1024", label: "iOS App Store 1024", size: 1024, shape: "square" as const },
  { id: "ios-180", label: "iOS iPhone 180", size: 180, shape: "square" as const },
  { id: "ios-120", label: "iOS iPhone 120", size: 120, shape: "square" as const },
  { id: "ios-167", label: "iOS iPad Pro 167", size: 167, shape: "square" as const },
  { id: "ios-152", label: "iOS iPad 152", size: 152, shape: "square" as const },
  { id: "android-foreground", label: "Android adaptive foreground 432", size: 432, shape: "square" as const, foregroundOnly: true },
  { id: "android-background", label: "Android adaptive background 432", size: 432, shape: "square" as const, backgroundOnly: true },
  { id: "android-legacy-192", label: "Android legacy 192", size: 192, shape: "full" as const },
  { id: "favicon-48", label: "Favicon 48", size: 48, shape: "full" as const },
];

/** Render only the background layer (for Android adaptive icons). */
export function renderIconBackgroundSvg(spec: AppIconSpec, size = 432): string {
  const noGlyph: AppIconSpec = { ...spec, content: "monogram", monogram: "" };
  return renderAppIconSvg(noGlyph, { size, shape: "square" });
}
