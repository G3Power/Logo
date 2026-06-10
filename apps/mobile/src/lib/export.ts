import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { renderLogoSvg, type AppIconSpec, type LogoSpec } from "@logomaker/logo-engine";
import { config } from "./config";

function slug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "logo";
}

function webDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

async function nativeShareBytes(bytes: Uint8Array, fileName: string): Promise<void> {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  file.write(bytes);
  await Sharing.shareAsync(file.uri);
}

/** Save/share the logo as a standalone SVG file. */
export async function exportLogoSvg(spec: LogoSpec): Promise<void> {
  const svg = renderLogoSvg(spec, { embedFontImport: true });
  const fileName = `${slug(spec.brandName)}-logo.svg`;
  if (Platform.OS === "web") {
    webDownload(new Blob([svg], { type: "image/svg+xml" }), fileName);
    return;
  }
  await nativeShareBytes(new TextEncoder().encode(svg), fileName);
}

/**
 * Download the full brand kit (logo SVG/PNG variants + iOS/Android icon
 * set) produced server-side, then save (web) or open the share sheet.
 */
export async function exportBrandKit(spec: LogoSpec, iconSpec: AppIconSpec): Promise<void> {
  const res = await fetch(`${config.apiUrl}/export`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ spec, iconSpec }),
  });
  if (!res.ok) {
    let message = "Export failed. Is the API server running?";
    try {
      const data = (await res.json()) as { error?: string };
      if (data.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
  const fileName = `${slug(spec.brandName)}-brand-kit.zip`;
  if (Platform.OS === "web") {
    webDownload(await res.blob(), fileName);
    return;
  }
  const bytes = new Uint8Array(await res.arrayBuffer());
  await nativeShareBytes(bytes, fileName);
}
