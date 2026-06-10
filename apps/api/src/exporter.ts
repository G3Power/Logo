import JSZip from "jszip";
import { Resvg } from "@resvg/resvg-js";
import {
  ICON_EXPORT_TARGETS,
  renderAppIconSvg,
  renderIconBackgroundSvg,
  renderLogoSvg,
  type AppIconSpec,
  type LogoSpec,
} from "@logomaker/logo-engine";
import { ensureFonts } from "./serverFonts";

function rasterize(svg: string, width: number, fontDir: string): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: {
      fontDirs: [fontDir],
      loadSystemFonts: true,
    },
    background: "rgba(0,0,0,0)",
  });
  return resvg.render().asPng();
}

/**
 * Build the full brand export pack as a zip:
 * - logo SVGs (color / white / black, with and without background)
 * - logo PNGs at multiple sizes
 * - app icon SVG + PNG set for iOS and Android (incl. adaptive layers)
 */
export async function buildExportZip(spec: LogoSpec, iconSpec: AppIconSpec): Promise<Buffer> {
  const fontDir = await ensureFonts([
    spec.nameFont.family,
    spec.taglineFont.family,
    iconSpec.fontFamily,
  ]);

  const zip = new JSZip();
  const logoDir = zip.folder("logo")!;
  const iconDir = zip.folder("app-icon")!;

  const colorSvg = renderLogoSvg(spec, { embedFontImport: true });
  const colorBgSvg = renderLogoSvg(spec, { embedFontImport: true, withBackground: true });
  const whiteSvg = renderLogoSvg(spec, { embedFontImport: true, monochrome: "#FFFFFF" });
  const blackSvg = renderLogoSvg(spec, { embedFontImport: true, monochrome: "#111111" });

  logoDir.file("logo-color.svg", colorSvg);
  logoDir.file("logo-color-bg.svg", colorBgSvg);
  logoDir.file("logo-white.svg", whiteSvg);
  logoDir.file("logo-black.svg", blackSvg);

  for (const width of [512, 1024, 2048]) {
    logoDir.file(`logo-color-${width}.png`, rasterize(colorSvg, width, fontDir));
  }
  logoDir.file("logo-white-1024.png", rasterize(whiteSvg, 1024, fontDir));
  logoDir.file("logo-black-1024.png", rasterize(blackSvg, 1024, fontDir));

  iconDir.file("icon-master.svg", renderAppIconSvg(iconSpec, { shape: "full" }));

  for (const target of ICON_EXPORT_TARGETS) {
    let svg: string;
    if (target.id === "android-background") {
      svg = renderIconBackgroundSvg(iconSpec, target.size);
    } else if ("foregroundOnly" in target && target.foregroundOnly) {
      svg = renderAppIconSvg(iconSpec, { size: target.size, shape: "square", foregroundOnly: true });
    } else {
      svg = renderAppIconSvg(iconSpec, { size: target.size, shape: target.shape });
    }
    iconDir.file(`${target.id}.png`, rasterize(svg, target.size, fontDir));
  }

  zip.file(
    "README.txt",
    [
      `${spec.brandName} brand export`,
      "",
      "logo/      Vector + raster logo lockups (color, white, black).",
      "app-icon/  App icon set:",
      "  - ios-1024 ... ios-152: iOS home screen / App Store sizes",
      "  - android-foreground/background: adaptive icon layers (432px)",
      "  - android-legacy-192: legacy launcher icon",
      "  - favicon-48: web favicon",
      "",
      "SVG files reference Google Fonts via @import and render correctly",
      "in browsers and modern design tools.",
    ].join("\n"),
  );

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}
