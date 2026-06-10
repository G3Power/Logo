import React, { useMemo } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { SvgXml } from "react-native-svg";
import { renderLogoSvg, type LogoSpec } from "@logomaker/logo-engine";
import { useLogoFonts } from "../lib/fonts";
import { radius } from "../theme";
import { useTheme } from "./ui";

/**
 * Live logo preview. Renders the spec's SVG with the brand background so
 * text colors always sit on their intended surface.
 */
export function LogoPreview({
  spec,
  height = 150,
  fontsReady,
}: {
  spec: LogoSpec;
  height?: number;
  /** Pass when a parent already coordinates font loading for many specs. */
  fontsReady?: boolean;
}) {
  const t = useTheme();
  const specs = useMemo(() => [spec], [spec]);
  const selfReady = useLogoFonts(fontsReady === undefined ? specs : []);
  const ready = fontsReady ?? selfReady;

  const svg = useMemo(
    () =>
      renderLogoSvg(spec, {
        height: 300,
        nativeFontNames: Platform.OS !== "web",
      }),
    [spec],
  );

  const bg = spec.palette.background === "transparent" ? t.checker : spec.palette.background;

  return (
    <View
      style={{
        backgroundColor: bg,
        borderRadius: radius.md,
        height,
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        width: "100%",
      }}
    >
      {ready ? (
        <SvgXml xml={svg} height={height * 0.82} width="100%" />
      ) : (
        <ActivityIndicator color={t.accent} />
      )}
    </View>
  );
}
