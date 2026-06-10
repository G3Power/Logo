import React, { useState } from "react";
import { Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { deriveIconSpec, type AppIconSpec } from "@logomaker/logo-engine";
import { useProject, useStore } from "../../lib/store";
import { exportBrandKit, exportLogoSvg } from "../../lib/export";
import { IconPreview } from "../../components/IconPreview";
import { LogoPreview } from "../../components/LogoPreview";
import {
  Button,
  Card,
  Chip,
  ChipRow,
  EmptyState,
  Screen,
  SectionLabel,
  Stepper,
  Subtitle,
  Swatch,
  Title,
  useTheme,
} from "../../components/ui";
import { spacing } from "../../theme";

export default function ExportScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const t = useTheme();
  const { updateIcon } = useStore();
  const project = useProject(id);
  const [exporting, setExporting] = useState(false);
  const [savingSvg, setSavingSvg] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!project) {
    return (
      <Screen>
        <EmptyState title="Project not found" body="This logo may have been deleted." />
      </Screen>
    );
  }

  const icon = project.iconSpec;
  const apply = (changes: Partial<AppIconSpec>) => updateIcon(project.id, { ...icon, ...changes });

  const bgChoices = [
    project.spec.palette.primary,
    project.spec.palette.secondary,
    project.spec.palette.text,
    "#FFFFFF",
    "#14130E",
  ];

  const runExport = async (fn: () => Promise<void>, setBusy: (b: boolean) => void) => {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await fn();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Screen>
      <Title>App icon</Title>
      <Subtitle>
        Your logo automatically becomes an app icon, ready for iOS and Android. Tweak it below.
      </Subtitle>

      <Card>
        <View style={{ flexDirection: "row", justifyContent: "space-evenly" }}>
          <IconPreview iconSpec={icon} size={104} shape="full" label="iOS" />
          <IconPreview iconSpec={icon} size={104} shape="circle" label="Android" />
          <IconPreview iconSpec={icon} size={104} shape="square" label="Store" />
        </View>
      </Card>

      <SectionLabel>Glyph</SectionLabel>
      <ChipRow>
        <Chip label="Logo symbol" selected={icon.content === "mark"} onPress={() => apply({ content: "mark" })} />
        <Chip
          label={`Monogram "${icon.monogram}"`}
          selected={icon.content === "monogram"}
          onPress={() => apply({ content: "monogram" })}
        />
      </ChipRow>

      <SectionLabel>Background</SectionLabel>
      <ChipRow>
        <Chip
          label="Gradient"
          selected={icon.backgroundStyle === "gradient"}
          onPress={() => apply({ backgroundStyle: "gradient" })}
        />
        <Chip
          label="Solid"
          selected={icon.backgroundStyle === "solid"}
          onPress={() => apply({ backgroundStyle: "solid" })}
        />
      </ChipRow>
      <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm }}>
        {bgChoices.map((c) => (
          <Swatch
            key={c}
            color={c}
            selected={icon.backgroundColor === c}
            onPress={() => {
              const next = deriveIconSpec({ ...project.spec, palette: { ...project.spec.palette, primary: c } });
              apply({
                backgroundColor: c,
                backgroundColorEnd: next.backgroundColorEnd,
                foregroundColor: next.foregroundColor,
                accentColor: next.accentColor,
              });
            }}
          />
        ))}
      </View>

      <SectionLabel>Proportions</SectionLabel>
      <Stepper
        label="Glyph size"
        value={icon.glyphScale}
        min={0.4}
        max={0.9}
        step={0.05}
        format={(v) => `${Math.round(v * 100)}%`}
        onChange={(v) => apply({ glyphScale: v })}
      />
      <Stepper
        label="Corner radius"
        value={icon.cornerRadius}
        min={0}
        max={0.5}
        step={0.05}
        format={(v) => `${Math.round(v * 200)}%`}
        onChange={(v) => apply({ cornerRadius: v })}
      />
      <Button
        label="Reset to match logo"
        variant="ghost"
        onPress={() => updateIcon(project.id, deriveIconSpec(project.spec))}
      />

      <SectionLabel>Your logo</SectionLabel>
      <LogoPreview spec={project.spec} height={120} />

      <SectionLabel>Export</SectionLabel>
      <View style={{ gap: spacing.sm }}>
        <Button
          label={savingSvg ? "Preparing SVG..." : "Save logo as SVG"}
          variant="secondary"
          loading={savingSvg}
          onPress={() => runExport(() => exportLogoSvg(project.spec), setSavingSvg)}
        />
        <Button
          label={exporting ? "Building brand kit..." : "Download brand kit (PNG + SVG + app icons)"}
          loading={exporting}
          onPress={() => runExport(() => exportBrandKit(project.spec, icon), setExporting)}
        />
      </View>
      <Text style={{ color: t.textSecondary, fontSize: 12, marginTop: spacing.sm }}>
        The brand kit includes color/white/black logo SVGs, PNGs up to 2048px, and a complete
        iOS + Android adaptive icon set.
      </Text>
      {error ? (
        <Text style={{ color: t.danger, marginTop: spacing.sm, fontWeight: "600" }}>{error}</Text>
      ) : null}
      {done && !error ? (
        <Text style={{ color: t.success, marginTop: spacing.sm, fontWeight: "600" }}>
          Export ready.
        </Text>
      ) : null}
    </Screen>
  );
}
