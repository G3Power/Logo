/** Layout arrangements supported by the renderer. */
export type LayoutVariant =
  | "icon-left"
  | "icon-top"
  | "wordmark"
  | "badge"
  | "monogram";

export type Casing = "upper" | "title" | "lower";

export type MarkStyle = "solid" | "duotone" | "outline";

export type BadgeShape = "circle" | "shield" | "hexagon" | "rounded";

export interface Palette {
  /** Main mark / brand color. */
  primary: string;
  /** Accent used by duotone marks and decorations. */
  secondary: string;
  /** Brand name text color. */
  text: string;
  /** Canvas background. "transparent" is allowed. */
  background: string;
}

export interface FontSpec {
  /** Google Fonts family name, e.g. "Space Grotesk". */
  family: string;
  weight: 400 | 500 | 600 | 700 | 800 | 900;
  /** Extra letter spacing in em units (0 = normal). */
  letterSpacing: number;
}

/**
 * A fully structured, renderable and editable description of a logo.
 * Every field is plain data so specs serialize cleanly and diff cheaply.
 */
export interface LogoSpec {
  id: string;
  brandName: string;
  tagline?: string;
  layout: LayoutVariant;
  casing: Casing;
  /** Mark id from the built-in library, or "monogram" for generated initials. */
  markId: string;
  markStyle: MarkStyle;
  /** Scale factor for the mark relative to the wordmark (0.6 - 1.6). */
  markScale: number;
  /** Gap factor between mark and text (0.4 - 2). */
  spacing: number;
  palette: Palette;
  nameFont: FontSpec;
  taglineFont: FontSpec;
  /** Only used when layout === "badge". */
  badgeShape?: BadgeShape;
  /** When set, an AI-generated raster mark is used instead of markId. */
  rasterMarkUrl?: string;
}

/** User-provided context describing the business / creator / idea. */
export interface Brief {
  brandName: string;
  tagline?: string;
  industry: string;
  /** Free-form vibe keywords, e.g. ["playful", "modern"]. */
  keywords: string[];
  /** Optional preferred colors as hex strings. */
  preferredColors?: string[];
}

/** Derived spec for an app icon based on a logo. */
export interface AppIconSpec {
  /** "mark" uses the logo mark, "monogram" uses brand initials. */
  content: "mark" | "monogram";
  markId: string;
  markStyle: MarkStyle;
  monogram: string;
  backgroundStyle: "solid" | "gradient";
  backgroundColor: string;
  backgroundColorEnd: string;
  foregroundColor: string;
  accentColor: string;
  /** Corner radius factor 0-0.5 of edge (preview only; stores intent). */
  cornerRadius: number;
  /** Scale of the glyph within the safe area (0.4 - 0.9). */
  glyphScale: number;
  fontFamily: string;
  fontWeight: FontSpec["weight"];
  rasterMarkUrl?: string;
}

export interface RenderOptions {
  /** Render the spec's background color; defaults to false (transparent). */
  withBackground?: boolean;
  /** Pixel height of the output viewBox; width is computed. Default 240. */
  height?: number;
  /** Inline a Google Fonts @import so standalone SVGs render correctly. */
  embedFontImport?: boolean;
  /** Force all colors to a single tone (for light/dark variants). */
  monochrome?: string;
  /**
   * Emit font-family as "Family_Weight" without a font-weight attribute.
   * Required on React Native, where fonts register one name per weight.
   */
  nativeFontNames?: boolean;
}
