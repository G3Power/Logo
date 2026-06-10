import { z } from "zod";
import { MARK_IDS } from "@logomaker/logo-engine";

const hexColor = z.string().regex(/^#[0-9a-fA-F]{3,8}$/, "expected hex color");

export const briefSchema = z.object({
  brandName: z.string().trim().min(1).max(60),
  tagline: z.string().trim().max(80).optional(),
  industry: z.string().trim().min(1).max(60),
  keywords: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
  preferredColors: z.array(hexColor).max(5).optional(),
});

export const fontSpecSchema = z.object({
  family: z.string().min(1),
  weight: z.union([
    z.literal(400),
    z.literal(500),
    z.literal(600),
    z.literal(700),
    z.literal(800),
    z.literal(900),
  ]),
  letterSpacing: z.number().min(-0.1).max(0.6),
});

export const paletteSchema = z.object({
  primary: hexColor,
  secondary: hexColor,
  text: hexColor,
  background: z.union([hexColor, z.literal("transparent")]),
});

export const logoSpecSchema = z.object({
  id: z.string().min(1),
  brandName: z.string().min(1).max(60),
  tagline: z.string().max(80).optional(),
  layout: z.enum(["icon-left", "icon-top", "wordmark", "badge", "monogram"]),
  casing: z.enum(["upper", "title", "lower"]),
  markId: z.union([z.enum([...MARK_IDS] as [string, ...string[]]), z.literal("monogram")]),
  markStyle: z.enum(["solid", "duotone", "outline"]),
  markScale: z.number().min(0.5).max(1.8),
  spacing: z.number().min(0.3).max(2.2),
  palette: paletteSchema,
  nameFont: fontSpecSchema,
  taglineFont: fontSpecSchema,
  badgeShape: z.enum(["circle", "shield", "hexagon", "rounded"]).optional(),
  rasterMarkUrl: z.string().url().optional(),
});

export const appIconSpecSchema = z.object({
  content: z.enum(["mark", "monogram"]),
  markId: z.string().min(1),
  markStyle: z.enum(["solid", "duotone", "outline"]),
  monogram: z.string().max(3),
  backgroundStyle: z.enum(["solid", "gradient"]),
  backgroundColor: hexColor,
  backgroundColorEnd: hexColor,
  foregroundColor: hexColor,
  accentColor: hexColor,
  cornerRadius: z.number().min(0).max(0.5),
  glyphScale: z.number().min(0.3).max(0.95),
  fontFamily: z.string().min(1),
  fontWeight: fontSpecSchema.shape.weight,
  rasterMarkUrl: z.string().url().optional(),
});

export const exportRequestSchema = z.object({
  spec: logoSpecSchema,
  iconSpec: appIconSpecSchema,
});

export const generateRequestSchema = z.object({
  brief: briefSchema,
  count: z.number().int().min(1).max(12).default(8),
  /** Optional seed for deterministic shuffles. */
  seed: z.number().int().optional(),
});

export const refineRequestSchema = z.object({
  spec: logoSpecSchema,
  instruction: z.string().trim().min(1).max(400),
});

export const generateMarkRequestSchema = z.object({
  brief: briefSchema,
  /** Extra description of the desired mark imagery. */
  markPrompt: z.string().trim().max(400).optional(),
});

export type BriefInput = z.input<typeof briefSchema>;
export type ExportRequest = z.input<typeof exportRequestSchema>;
export type GenerateRequest = z.input<typeof generateRequestSchema>;
export type RefineRequest = z.input<typeof refineRequestSchema>;
export type GenerateMarkRequest = z.input<typeof generateMarkRequestSchema>;
