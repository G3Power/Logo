import React, { useMemo } from "react";
import { Platform, Text, View } from "react-native";
import { SvgXml } from "react-native-svg";
import {
  renderAppIconSvg,
  type AppIconSpec,
  type AppIconRenderOptions,
} from "@logomaker/logo-engine";
import { spacing } from "../theme";
import { useTheme } from "./ui";

export function IconPreview({
  iconSpec,
  size = 96,
  shape = "full",
  label,
}: {
  iconSpec: AppIconSpec;
  size?: number;
  shape?: AppIconRenderOptions["shape"];
  label?: string;
}) {
  const t = useTheme();
  const svg = useMemo(
    () =>
      renderAppIconSvg(iconSpec, {
        size: 512,
        shape,
        nativeFontNames: Platform.OS !== "web",
      }),
    [iconSpec, shape],
  );
  return (
    <View style={{ alignItems: "center", gap: spacing.xs }}>
      <SvgXml xml={svg} width={size} height={size} />
      {label ? <Text style={{ fontSize: 12, color: t.textSecondary }}>{label}</Text> : null}
    </View>
  );
}
