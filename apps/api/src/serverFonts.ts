import { mkdir, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { googleFontsUrl } from "@logomaker/logo-engine";

const FONT_DIR = join(tmpdir(), "logomaker-fonts");
const downloaded = new Set<string>();

/**
 * Download the TTFs for the given families into a temp dir so server-side
 * SVG -> PNG rasterization renders real typography. Best-effort: failures
 * leave rasterization on the system default font.
 */
export async function ensureFonts(families: string[]): Promise<string> {
  await mkdir(FONT_DIR, { recursive: true });
  const missing = families.filter((f) => !downloaded.has(f));
  if (missing.length === 0) return FONT_DIR;

  try {
    // A non-browser UA makes Google Fonts return TTF sources.
    const css = await fetch(googleFontsUrl(missing), {
      headers: { "User-Agent": "curl/8.0" },
    }).then((r) => r.text());

    const urls = [...new Set(css.match(/https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf/g) ?? [])];
    const existing = new Set(await readdir(FONT_DIR));
    await Promise.all(
      urls.map(async (url) => {
        const name = url.split("/").slice(-2).join("-");
        if (existing.has(name)) return;
        const buf = await fetch(url).then((r) => r.arrayBuffer());
        await writeFile(join(FONT_DIR, name), Buffer.from(buf));
      }),
    );
    for (const f of missing) downloaded.add(f);
  } catch (err) {
    console.warn("Font download failed; PNG exports will use fallback fonts.", err);
  }
  return FONT_DIR;
}
