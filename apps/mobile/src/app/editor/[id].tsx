import React, { useMemo, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  FONT_PAIRINGS,
  MARKS,
  PALETTES,
  searchMarks,
  suggestHarmonies,
  newSpecId,
  type BadgeShape,
  type Casing,
  type LayoutVariant,
  type LogoSpec,
  type MarkStyle,
} from "@logomaker/logo-engine";
import { api, refineWithFallback } from "../../lib/api";
import { useProject, useStore } from "../../lib/store";
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
  Swatch,
  TextField,
  useTheme,
} from "../../components/ui";
import { radius, spacing } from "../../theme";

type Panel = "text" | "layout" | "icon" | "colors" | "fonts" | "ai";
const PANELS: { id: Panel; label: string }[] = [
  { id: "text", label: "Text" },
  { id: "layout", label: "Layout" },
  { id: "icon", label: "Icon" },
  { id: "colors", label: "Colors" },
  { id: "fonts", label: "Fonts" },
  { id: "ai", label: "AI" },
];

const LAYOUTS: { id: LayoutVariant; label: string }[] = [
  { id: "icon-left", label: "Icon left" },
  { id: "icon-top", label: "Icon top" },
  { id: "wordmark", label: "Wordmark" },
  { id: "monogram", label: "Monogram" },
  { id: "badge", label: "Badge" },
];

const CASINGS: { id: Casing; label: string }[] = [
  { id: "title", label: "Title Case" },
  { id: "upper", label: "UPPERCASE" },
  { id: "lower", label: "lowercase" },
];

const MARK_STYLES: { id: MarkStyle; label: string }[] = [
  { id: "solid", label: "Solid" },
  { id: "duotone", label: "Duotone" },
  { id: "outline", label: "Outline" },
];

const BADGE_SHAPES: { id: BadgeShape; label: string }[] = [
  { id: "circle", label: "Circle" },
  { id: "shield", label: "Shield" },
  { id: "hexagon", label: "Hexagon" },
  { id: "rounded", label: "Rounded" },
];

const COLOR_ROLES = ["primary", "secondary", "text", "background"] as const;
type ColorRole = (typeof COLOR_ROLES)[number];

export default function EditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const t = useTheme();
  const { updateSpec, undo, redo } = useStore();
  const project = useProject(id);
  const [panel, setPanel] = useState<Panel>("text");
  const [markQuery, setMarkQuery] = useState("");
  const [colorRole, setColorRole] = useState<ColorRole>("primary");
  const [hexInput, setHexInput] = useState("");
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [generatingMark, setGeneratingMark] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const spec = project?.spec;
  const harmonies = useMemo(
    () => (spec ? suggestHarmonies(spec.palette.primary) : []),
    [spec],
  );

  if (!project || !spec) {
    return (
      <Screen>
        <EmptyState title="Project not found" body="This logo may have been deleted." />
      </Screen>
    );
  }

  const apply = (changes: Partial<LogoSpec>) => {
    updateSpec(project.id, { ...spec, ...changes, id: newSpecId() });
  };

  const setColor = (value: string) => {
    apply({ palette: { ...spec.palette, [colorRole]: value } });
  };

  const submitHex = () => {
    const v = hexInput.trim().startsWith("#") ? hexInput.trim() : `#${hexInput.trim()}`;
    if (/^#[0-9a-fA-F]{6}$/.test(v)) {
      setColor(v.toUpperCase());
      setHexInput("");
    }
  };

  const runRefine = async () => {
    if (!instruction.trim() || refining) return;
    setRefining(true);
    setAiError(null);
    try {
      const { spec: revised } = await refineWithFallback(spec, instruction.trim());
      updateSpec(project.id, revised);
      setInstruction("");
    } catch {
      setAiError("Refinement failed. Please try again.");
    } finally {
      setRefining(false);
    }
  };

  const generateAiMark = async () => {
    setGeneratingMark(true);
    setAiError(null);
    try {
      const { url } = await api.generateMark({ brief: project.brief });
      apply({ rasterMarkUrl: url });
    } catch (err) {
      setAiError(
        err instanceof Error ? err.message : "AI mark generation is unavailable right now.",
      );
    } finally {
      setGeneratingMark(false);
    }
  };

  const markResults = searchMarks(markQuery);

  return (
    <Screen>
      <LogoPreview spec={spec} height={170} />

      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: spacing.sm }}>
        <View style={{ flexDirection: "row", gap: spacing.sm }}>
          <Pressable
            onPress={() => undo(project.id)}
            disabled={project.history.length === 0}
            style={{ opacity: project.history.length === 0 ? 0.35 : 1 }}
          >
            <Text style={{ color: t.accent, fontWeight: "700" }}>↩ Undo</Text>
          </Pressable>
          <Pressable
            onPress={() => redo(project.id)}
            disabled={project.future.length === 0}
            style={{ opacity: project.future.length === 0 ? 0.35 : 1 }}
          >
            <Text style={{ color: t.accent, fontWeight: "700" }}>Redo ↪</Text>
          </Pressable>
        </View>
        <Pressable onPress={() => router.push(`/export/${project.id}`)}>
          <Text style={{ color: t.accent, fontWeight: "700" }}>App icon & export →</Text>
        </Pressable>
      </View>

      <View
        style={{
          flexDirection: "row",
          backgroundColor: t.surfaceAlt,
          borderRadius: radius.md,
          padding: 4,
          marginTop: spacing.md,
        }}
      >
        {PANELS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => setPanel(p.id)}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: radius.sm,
              backgroundColor: panel === p.id ? t.surface : "transparent",
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: panel === p.id ? "700" : "500",
                color: panel === p.id ? t.text : t.textSecondary,
              }}
            >
              {p.label}
            </Text>
          </Pressable>
        ))}
      </View>

      {panel === "text" ? (
        <View>
          <SectionLabel>Brand name</SectionLabel>
          <TextField
            value={spec.brandName}
            onChangeText={(v) => apply({ brandName: v })}
            maxLength={60}
          />
          <SectionLabel>Tagline</SectionLabel>
          <TextField
            value={spec.tagline ?? ""}
            placeholder="Add a tagline"
            onChangeText={(v) => apply({ tagline: v || undefined })}
            maxLength={80}
          />
          <SectionLabel>Casing</SectionLabel>
          <ChipRow>
            {CASINGS.map((c) => (
              <Chip
                key={c.id}
                label={c.label}
                selected={spec.casing === c.id}
                onPress={() => apply({ casing: c.id })}
              />
            ))}
          </ChipRow>
        </View>
      ) : null}

      {panel === "layout" ? (
        <View>
          <SectionLabel>Arrangement</SectionLabel>
          <ChipRow>
            {LAYOUTS.map((l) => (
              <Chip
                key={l.id}
                label={l.label}
                selected={spec.layout === l.id}
                onPress={() => apply({ layout: l.id })}
              />
            ))}
          </ChipRow>
          {spec.layout === "badge" ? (
            <>
              <SectionLabel>Badge shape</SectionLabel>
              <ChipRow>
                {BADGE_SHAPES.map((b) => (
                  <Chip
                    key={b.id}
                    label={b.label}
                    selected={(spec.badgeShape ?? "circle") === b.id}
                    onPress={() => apply({ badgeShape: b.id })}
                  />
                ))}
              </ChipRow>
            </>
          ) : null}
          <SectionLabel>Proportions</SectionLabel>
          <Stepper
            label="Icon size"
            value={spec.markScale}
            min={0.6}
            max={1.6}
            onChange={(v) => apply({ markScale: v })}
          />
          <Stepper
            label="Spacing"
            value={spec.spacing}
            min={0.4}
            max={2}
            onChange={(v) => apply({ spacing: v })}
          />
        </View>
      ) : null}

      {panel === "icon" ? (
        <View>
          <SectionLabel>Style</SectionLabel>
          <ChipRow>
            {MARK_STYLES.map((m) => (
              <Chip
                key={m.id}
                label={m.label}
                selected={spec.markStyle === m.id}
                onPress={() => apply({ markStyle: m.id })}
              />
            ))}
          </ChipRow>
          <SectionLabel>Symbol</SectionLabel>
          <TextField
            placeholder="Search symbols (e.g. coffee, tech, nature)"
            value={markQuery}
            onChangeText={setMarkQuery}
          />
          <ChipRow>
            <Chip
              label="Monogram"
              selected={spec.markId === "monogram" && !spec.rasterMarkUrl}
              onPress={() => apply({ markId: "monogram", rasterMarkUrl: undefined })}
            />
            {markResults.map((m) => (
              <Chip
                key={m.id}
                label={m.name}
                selected={spec.markId === m.id && !spec.rasterMarkUrl}
                onPress={() => apply({ markId: m.id, rasterMarkUrl: undefined })}
              />
            ))}
          </ChipRow>
          {markQuery && markResults.length === 0 ? (
            <Text style={{ color: t.textSecondary, marginTop: spacing.sm }}>
              No symbols match "{markQuery}". Try the AI tab for a unique mark.
            </Text>
          ) : null}
        </View>
      ) : null}

      {panel === "colors" ? (
        <View>
          <SectionLabel>Editing</SectionLabel>
          <ChipRow>
            {COLOR_ROLES.map((role) => (
              <Chip
                key={role}
                label={`${role} ${spec.palette[role] === "transparent" ? "" : spec.palette[role]}`}
                selected={colorRole === role}
                onPress={() => setColorRole(role)}
              />
            ))}
          </ChipRow>
          <SectionLabel>Suggestions for {colorRole}</SectionLabel>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
            {harmonies.map((c) => (
              <Swatch key={c} color={c} selected={spec.palette[colorRole] === c} onPress={() => setColor(c)} />
            ))}
            {colorRole === "background" ? (
              <>
                <Swatch color="#FFFFFF" selected={spec.palette.background === "#FFFFFF"} onPress={() => setColor("#FFFFFF")} />
                <Swatch color="#14130E" selected={spec.palette.background === "#14130E"} onPress={() => setColor("#14130E")} />
              </>
            ) : null}
          </View>
          <View style={{ flexDirection: "row", gap: spacing.sm, marginTop: spacing.md, alignItems: "center" }}>
            <View style={{ flex: 1 }}>
              <TextField
                placeholder="Custom hex e.g. #FF5733"
                value={hexInput}
                onChangeText={setHexInput}
                autoCapitalize="none"
                style={{ marginBottom: 0 }}
              />
            </View>
            <Button label="Apply" variant="secondary" onPress={submitHex} />
          </View>
          <SectionLabel>Curated palettes</SectionLabel>
          <View style={{ gap: spacing.sm }}>
            {PALETTES.map((p) => (
              <Card
                key={p.id}
                onPress={() =>
                  apply({
                    palette: {
                      primary: p.primary,
                      secondary: p.secondary,
                      text: p.text,
                      background: p.background,
                    },
                  })
                }
                style={{ padding: spacing.sm }}
              >
                <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
                  <Swatch color={p.primary} size={26} />
                  <Swatch color={p.secondary} size={26} />
                  <Swatch color={p.text} size={26} />
                  <Swatch color={p.background} size={26} />
                  <Text style={{ color: t.text, fontWeight: "600", marginLeft: spacing.sm }}>{p.name}</Text>
                </View>
              </Card>
            ))}
          </View>
        </View>
      ) : null}

      {panel === "fonts" ? (
        <View>
          <SectionLabel>Font pairing</SectionLabel>
          <View style={{ gap: spacing.sm }}>
            {FONT_PAIRINGS.map((pairing) => {
              const active = spec.nameFont.family === pairing.nameFont.family;
              return (
                <Card
                  key={pairing.id}
                  selected={active}
                  onPress={() =>
                    apply({ nameFont: pairing.nameFont, taglineFont: pairing.taglineFont })
                  }
                  style={{ padding: spacing.sm, paddingHorizontal: spacing.md }}
                >
                  <Text style={{ color: t.text, fontWeight: "700", fontSize: 15 }}>{pairing.name}</Text>
                  <Text style={{ color: t.textSecondary, fontSize: 12 }}>
                    {pairing.nameFont.family} + {pairing.taglineFont.family} · {pairing.tags.join(", ")}
                  </Text>
                </Card>
              );
            })}
          </View>
        </View>
      ) : null}

      {panel === "ai" ? (
        <View>
          <SectionLabel>Describe a change</SectionLabel>
          <TextField
            placeholder='e.g. "make it more playful" or "use green tones"'
            value={instruction}
            onChangeText={setInstruction}
            multiline
            numberOfLines={3}
            style={{ minHeight: 70, textAlignVertical: "top" }}
          />
          <Button
            label={refining ? "Refining..." : "Refine logo"}
            onPress={runRefine}
            disabled={!instruction.trim()}
            loading={refining}
          />
          <SectionLabel>Unique AI mark</SectionLabel>
          <Text style={{ color: t.textSecondary, fontSize: 13, marginBottom: spacing.sm }}>
            Generate a one-of-a-kind symbol with AI image generation, replacing the built-in symbol.
          </Text>
          <View style={{ flexDirection: "row", gap: spacing.sm }}>
            <Button
              label={generatingMark ? "Generating..." : "Generate AI mark"}
              variant="secondary"
              onPress={generateAiMark}
              loading={generatingMark}
              style={{ flex: 1 }}
            />
            {spec.rasterMarkUrl ? (
              <Button
                label="Remove"
                variant="danger"
                onPress={() => apply({ rasterMarkUrl: undefined })}
              />
            ) : null}
          </View>
          {aiError ? (
            <Text style={{ color: t.danger, marginTop: spacing.md, fontWeight: "600" }}>{aiError}</Text>
          ) : null}
        </View>
      ) : null}
    </Screen>
  );
}
