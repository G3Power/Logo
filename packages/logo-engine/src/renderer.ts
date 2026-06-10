import { getMark } from "./marks";
import { isDark } from "./palettes";
import { googleFontsUrl } from "./fonts";
import type { Casing, FontSpec, LogoSpec, RenderOptions } from "./types";

export function applyCasing(text: string, casing: Casing): string {
  switch (casing) {
    case "upper":
      return text.toUpperCase();
    case "lower":
      return text.toLowerCase();
    case "title":
      return text
        .split(" ")
        .map((w) => (w ? w[0]!.toUpperCase() + w.slice(1) : w))
        .join(" ");
    default: {
      const exhaustive: never = casing;
      throw new Error(`Unknown casing: ${String(exhaustive)}`);
    }
  }
}

/**
 * Approximate average glyph width (em) for width estimation without a
 * canvas. Keyed by family; falls back to a sans-serif default.
 */
const FAMILY_WIDTH_FACTOR: Record<string, number> = {
  "Space Grotesk": 0.6,
  "Playfair Display": 0.55,
  Poppins: 0.62,
  Montserrat: 0.64,
  "DM Serif Display": 0.55,
  "Archivo Black": 0.72,
  Lobster: 0.5,
  Pacifico: 0.55,
  "Cormorant Garamond": 0.5,
  Raleway: 0.58,
  "Bebas Neue": 0.42,
  Fraunces: 0.55,
  Orbitron: 0.78,
  "Abril Fatface": 0.58,
  Quicksand: 0.6,
  Rubik: 0.6,
  Marcellus: 0.55,
  Caveat: 0.42,
  Sora: 0.62,
  "Alfa Slab One": 0.68,
  "Josefin Sans": 0.55,
  Manrope: 0.6,
  "Yeseva One": 0.62,
  Chivo: 0.6,
  "Space Mono": 0.62,
};

export function estimateTextWidth(text: string, font: FontSpec, fontSize: number): number {
  const factor = FAMILY_WIDTH_FACTOR[font.family] ?? 0.58;
  const weightBoost = 1 + (font.weight - 400) / 4000;
  const base = text.length * fontSize * factor * weightBoost;
  const spacing = Math.max(0, text.length - 1) * font.letterSpacing * fontSize;
  return base + spacing;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Registered font name used on React Native for a family+weight combo. */
export function nativeFontName(font: FontSpec): string {
  return `${font.family.replace(/ /g, "")}_${font.weight}`;
}

export function fontAttrs(font: FontSpec, nativeNames: boolean): string {
  if (nativeNames) {
    return `font-family="${nativeFontName(font)}"`;
  }
  return `font-family="'${font.family}', sans-serif" font-weight="${font.weight}"`;
}

function textEl(
  text: string,
  x: number,
  y: number,
  font: FontSpec,
  fontSize: number,
  fill: string,
  anchor: "start" | "middle" = "start",
  nativeNames = false,
): string {
  const ls = font.letterSpacing !== 0 ? ` letter-spacing="${(font.letterSpacing * fontSize).toFixed(2)}"` : "";
  return (
    `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" ` +
    `${fontAttrs(font, nativeNames)} font-size="${fontSize}"` +
    `${ls} fill="${fill}" text-anchor="${anchor}" dominant-baseline="alphabetic">` +
    `${escapeXml(text)}</text>`
  );
}

export function getInitials(brandName: string): string {
  const words = brandName.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2);
  return (words[0]![0] ?? "") + (words[1]![0] ?? "");
}

/** Renders the spec's mark as inner SVG sized into a box at (x, y, size). */
function renderMarkInto(spec: LogoSpec, x: number, y: number, size: number, nativeNames = false): string {
  if (spec.rasterMarkUrl) {
    return `<image href="${escapeXml(spec.rasterMarkUrl)}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }
  if (spec.markId === "monogram") {
    const initials = applyCasing(getInitials(spec.brandName), "upper");
    const fg = isDark(spec.palette.primary) ? "#FFFFFF" : spec.palette.text;
    return (
      `<g transform="translate(${x} ${y})">` +
      `<rect width="${size}" height="${size}" rx="${size * 0.24}" fill="${spec.palette.primary}"/>` +
      textEl(initials, size / 2, size * 0.68, { family: spec.nameFont.family, weight: 700, letterSpacing: 0.02 }, size * 0.42, fg, "middle", nativeNames) +
      `</g>`
    );
  }
  const mark = getMark(spec.markId);
  if (!mark) return "";
  const inner = mark.render(
    { primary: spec.palette.primary, secondary: spec.palette.secondary },
    spec.markStyle,
  );
  const scale = size / 100;
  return `<g transform="translate(${x} ${y}) scale(${scale.toFixed(4)})">${inner}</g>`;
}

interface Layouted {
  width: number;
  height: number;
  body: string;
}

const BASE = 240; // internal design height for a standard logo lockup

function layoutLogo(spec: LogoSpec, nativeNames = false): Layouted {
  const t = (
    text: string,
    x: number,
    y: number,
    font: FontSpec,
    fontSize: number,
    fill: string,
    anchor: "start" | "middle" = "start",
  ) => textEl(text, x, y, font, fontSize, fill, anchor, nativeNames);
  const name = applyCasing(spec.brandName, spec.casing);
  const tagline = spec.tagline ? applyCasing(spec.tagline, "upper") : undefined;

  const nameSize = 64;
  const taglineSize = 20;
  const nameW = estimateTextWidth(name, spec.nameFont, nameSize);
  const taglineW = tagline ? estimateTextWidth(tagline, spec.taglineFont, taglineSize) : 0;
  const markSize = 110 * spec.markScale;
  const gap = 26 * spec.spacing;
  const pad = 24;
  const { palette } = spec;

  switch (spec.layout) {
    case "icon-left": {
      const textBlockH = tagline ? nameSize + 14 + taglineSize : nameSize;
      const height = Math.max(markSize, textBlockH) + pad * 2;
      const textX = pad + markSize + gap;
      const width = textX + Math.max(nameW, taglineW) + pad;
      const markY = (height - markSize) / 2;
      const textTop = (height - textBlockH) / 2;
      const nameY = textTop + nameSize * 0.78;
      let body = renderMarkInto(spec, pad, markY, markSize, nativeNames);
      body += t(name, textX, nameY, spec.nameFont, nameSize, palette.text);
      if (tagline) {
        body += t(tagline, textX, nameY + 14 + taglineSize, spec.taglineFont, taglineSize, palette.primary);
      }
      return { width, height, body };
    }
    case "icon-top": {
      const textBlockH = tagline ? nameSize + 14 + taglineSize : nameSize;
      const height = pad + markSize + gap + textBlockH + pad;
      const width = Math.max(markSize, nameW, taglineW) + pad * 2;
      const cx = width / 2;
      const nameY = pad + markSize + gap + nameSize * 0.78;
      let body = renderMarkInto(spec, cx - markSize / 2, pad, markSize, nativeNames);
      body += t(name, cx, nameY, spec.nameFont, nameSize, palette.text, "middle");
      if (tagline) {
        body += t(tagline, cx, nameY + 14 + taglineSize, spec.taglineFont, taglineSize, palette.primary, "middle");
      }
      return { width, height, body };
    }
    case "wordmark": {
      const textBlockH = tagline ? nameSize + 16 + taglineSize : nameSize;
      const height = textBlockH + pad * 2;
      const width = Math.max(nameW, taglineW) + pad * 2;
      const cx = width / 2;
      const nameY = pad + nameSize * 0.78;
      let body = t(name, cx, nameY, spec.nameFont, nameSize, palette.text, "middle");
      if (tagline) {
        body += t(tagline, cx, nameY + 16 + taglineSize, spec.taglineFont, taglineSize, palette.primary, "middle");
      }
      return { width, height, body };
    }
    case "badge": {
      const innerNameSize = 38;
      const innerNameW = estimateTextWidth(name, spec.nameFont, innerNameSize);
      const r = Math.max(105, innerNameW / 2 + 30, markSize * 0.62 + 52);
      const size = r * 2 + 16;
      const c = size / 2;
      const shape = spec.badgeShape ?? "circle";
      const stroke = `fill="none" stroke="${palette.primary}" stroke-width="6"`;
      let outline: string;
      switch (shape) {
        case "circle":
          outline = `<circle cx="${c}" cy="${c}" r="${r}" ${stroke}/><circle cx="${c}" cy="${c}" r="${r - 12}" fill="none" stroke="${palette.secondary}" stroke-width="2.5"/>`;
          break;
        case "shield":
          outline = `<path d="M${c} ${c - r} L${c + r * 0.92} ${c - r * 0.62} V${c + r * 0.28} C${c + r * 0.92} ${c + r * 0.72} ${c + r * 0.45} ${c + r * 0.92} ${c} ${c + r} C${c - r * 0.45} ${c + r * 0.92} ${c - r * 0.92} ${c + r * 0.72} ${c - r * 0.92} ${c + r * 0.28} V${c - r * 0.62} Z" ${stroke}/>`;
          break;
        case "hexagon": {
          const pts: string[] = [];
          for (let i = 0; i < 6; i++) {
            const a = ((-90 + 60 * i) * Math.PI) / 180;
            pts.push(`${(c + r * Math.cos(a)).toFixed(1)},${(c + r * Math.sin(a)).toFixed(1)}`);
          }
          outline = `<polygon points="${pts.join(" ")}" ${stroke}/>`;
          break;
        }
        case "rounded":
          outline = `<rect x="${c - r}" y="${c - r}" width="${r * 2}" height="${r * 2}" rx="${r * 0.3}" ${stroke}/>`;
          break;
        default: {
          const exhaustive: never = shape;
          throw new Error(`Unknown badge shape: ${String(exhaustive)}`);
        }
      }
      const badgeMark = markSize * 0.78;
      let body = outline;
      body += renderMarkInto(spec, c - badgeMark / 2, c - badgeMark - 8, badgeMark, nativeNames);
      body += t(name, c, c + innerNameSize + 14, spec.nameFont, innerNameSize, palette.text, "middle");
      if (tagline) {
        body += t(tagline, c, c + innerNameSize + 14 + 26, spec.taglineFont, 15, palette.primary, "middle");
      }
      return { width: size, height: size, body };
    }
    case "monogram": {
      const mono = markSize * 1.1;
      const monoSpec: LogoSpec = { ...spec, markId: "monogram", rasterMarkUrl: undefined };
      const textBlockH = tagline ? nameSize + 14 + taglineSize : nameSize;
      const height = Math.max(mono, textBlockH) + pad * 2;
      const textX = pad + mono + gap;
      const width = textX + Math.max(nameW, taglineW) + pad;
      const textTop = (height - textBlockH) / 2;
      const nameY = textTop + nameSize * 0.78;
      let body = renderMarkInto(monoSpec, pad, (height - mono) / 2, mono, nativeNames);
      body += t(name, textX, nameY, spec.nameFont, nameSize, palette.text);
      if (tagline) {
        body += t(tagline, textX, nameY + 14 + taglineSize, spec.taglineFont, taglineSize, palette.primary);
      }
      return { width, height, body };
    }
    default: {
      const exhaustive: never = spec.layout;
      throw new Error(`Unknown layout: ${String(exhaustive)}`);
    }
  }
}

/** Render a LogoSpec to a standalone SVG string. */
export function renderLogoSvg(spec: LogoSpec, options: RenderOptions = {}): string {
  let working = spec;
  if (options.monochrome) {
    const tone = options.monochrome;
    working = {
      ...spec,
      palette: { primary: tone, secondary: tone, text: tone, background: "transparent" },
    };
  }
  const { width, height, body } = layoutLogo(working, options.nativeFontNames ?? false);
  const outH = options.height ?? BASE;
  const outW = (width / height) * outH;

  const bg =
    options.withBackground && working.palette.background !== "transparent"
      ? `<rect width="${width.toFixed(1)}" height="${height.toFixed(1)}" fill="${working.palette.background}"/>`
      : "";
  const fontImport = options.embedFontImport
    ? `<defs><style>@import url('${googleFontsUrl([working.nameFont.family, working.taglineFont.family]).replace(/&/g, "&amp;")}');</style></defs>`
    : "";

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${outW.toFixed(1)}" height="${outH}" ` +
    `viewBox="0 0 ${width.toFixed(1)} ${height.toFixed(1)}">` +
    fontImport +
    bg +
    body +
    `</svg>`
  );
}
