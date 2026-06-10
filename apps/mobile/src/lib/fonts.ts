import { useEffect, useState } from "react";
import { Platform } from "react-native";
import * as Font from "expo-font";
import {
  googleFontsUrl,
  nativeFontName,
  type FontSpec,
  type LogoSpec,
} from "@logomaker/logo-engine";

const loadedWebFamilies = new Set<string>();
const loadedNativeFonts = new Set<string>();
let nativeCssPromise: Promise<Map<string, string>> | null = null;

/** On web, inject a Google Fonts stylesheet for the given families. */
function ensureWebFonts(families: string[]): void {
  const missing = families.filter((f) => !loadedWebFamilies.has(f));
  if (missing.length === 0) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = googleFontsUrl(missing);
  document.head.appendChild(link);
  for (const f of missing) loadedWebFamilies.add(f);
}

/**
 * Fetch the Google Fonts CSS with a non-browser UA (returns TTF sources,
 * which native font loading supports) and map "Family_Weight" -> ttf URL.
 */
async function nativeFontMap(): Promise<Map<string, string>> {
  if (!nativeCssPromise) {
    nativeCssPromise = (async () => {
      const css = await fetch(googleFontsUrl(), {
        headers: { "User-Agent": "curl/8.0" },
      }).then((r) => r.text());
      const map = new Map<string, string>();
      const blockRe =
        /@font-face\s*\{[^}]*?font-family:\s*'([^']+)'[^}]*?font-weight:\s*(\d+)[^}]*?url\((https:[^)]+\.ttf)\)[^}]*?\}/g;
      let m: RegExpExecArray | null;
      while ((m = blockRe.exec(css))) {
        const key = `${m[1]!.replace(/ /g, "")}_${m[2]}`;
        if (!map.has(key)) map.set(key, m[3]!);
      }
      return map;
    })();
  }
  return nativeCssPromise;
}

async function ensureNativeFonts(fonts: FontSpec[]): Promise<void> {
  const wanted = fonts
    .map((f) => ({ name: nativeFontName(f), spec: f }))
    .filter((f) => !loadedNativeFonts.has(f.name));
  if (wanted.length === 0) return;

  const map = await nativeFontMap();
  const toLoad: Record<string, string> = {};
  for (const { name } of wanted) {
    const url = map.get(name);
    if (url) toLoad[name] = url;
  }
  if (Object.keys(toLoad).length > 0) {
    await Font.loadAsync(toLoad);
  }
  for (const { name } of wanted) loadedNativeFonts.add(name);
}

export function fontsForSpecs(specs: LogoSpec[]): FontSpec[] {
  const seen = new Map<string, FontSpec>();
  for (const spec of specs) {
    for (const f of [
      spec.nameFont,
      spec.taglineFont,
      // Monogram glyphs always render at weight 700.
      { ...spec.nameFont, weight: 700 as const },
    ]) {
      seen.set(`${f.family}_${f.weight}`, f);
    }
  }
  return [...seen.values()];
}

/** Load all fonts needed to render the given specs; returns readiness. */
export function useLogoFonts(specs: LogoSpec[]): boolean {
  const [ready, setReady] = useState(Platform.OS === "web");
  const key = specs
    .map((s) => `${s.nameFont.family}${s.nameFont.weight}|${s.taglineFont.family}${s.taglineFont.weight}`)
    .join(",");

  useEffect(() => {
    const fonts = fontsForSpecs(specs);
    if (Platform.OS === "web") {
      ensureWebFonts(fonts.map((f) => f.family));
      setReady(true);
      return;
    }
    let cancelled = false;
    setReady(false);
    ensureNativeFonts(fonts)
      .catch((err) => console.warn("Font loading failed:", err))
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return ready;
}
