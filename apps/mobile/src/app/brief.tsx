import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import type { Brief } from "@logomaker/logo-engine";
import { generateWithFallback } from "../lib/api";
import { useStore } from "../lib/store";
import {
  Button,
  Chip,
  ChipRow,
  Screen,
  SectionLabel,
  Subtitle,
  Swatch,
  TextField,
  Title,
  useTheme,
} from "../components/ui";
import { spacing } from "../theme";

const INDUSTRIES = [
  "Tech / Software",
  "Food & Drink",
  "Health & Wellness",
  "Finance",
  "Creator / Media",
  "Retail / Fashion",
  "Education",
  "Real Estate",
  "Fitness & Sports",
  "Travel",
  "Beauty",
  "Other",
];

const VIBES = [
  "modern",
  "playful",
  "elegant",
  "bold",
  "minimal",
  "warm",
  "trustworthy",
  "luxury",
  "organic",
  "futuristic",
  "vintage",
  "friendly",
];

const COLOR_CHOICES = [
  "#5B5BEA",
  "#2563EB",
  "#0D9488",
  "#1F9D55",
  "#EAB308",
  "#EA7317",
  "#D7263D",
  "#DB2777",
  "#7C3AED",
  "#17181C",
  "#6B4226",
  "#C9A227",
];

export default function BriefScreen() {
  const router = useRouter();
  const t = useTheme();
  const { setSession } = useStore();

  const [brandName, setBrandName] = useState("");
  const [tagline, setTagline] = useState("");
  const [industry, setIndustry] = useState<string | null>(null);
  const [customIndustry, setCustomIndustry] = useState("");
  const [vibes, setVibes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = (list: string[], setList: (v: string[]) => void, value: string, max: number) => {
    if (list.includes(value)) setList(list.filter((v) => v !== value));
    else if (list.length < max) setList([...list, value]);
  };

  const resolvedIndustry = industry === "Other" ? customIndustry : industry;
  const canSubmit = brandName.trim().length > 0 && Boolean(resolvedIndustry?.trim());

  const submit = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setError(null);
    const brief: Brief = {
      brandName: brandName.trim(),
      tagline: tagline.trim() || undefined,
      industry: resolvedIndustry!.trim(),
      keywords: vibes,
      preferredColors: colors.length ? colors : undefined,
    };
    try {
      const { specs, source } = await generateWithFallback(brief, 8);
      setSession(brief, specs, source);
      router.push("/gallery");
    } catch {
      setError("Could not generate concepts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <Title>Tell us about your brand</Title>
      <Subtitle>The more context you share, the better the concepts will match your vision.</Subtitle>

      <TextField
        label="Brand or project name *"
        placeholder="e.g. Acme Coffee"
        value={brandName}
        onChangeText={setBrandName}
        maxLength={60}
        autoFocus
      />
      <TextField
        label="Tagline (optional)"
        placeholder="e.g. Brewed with care"
        value={tagline}
        onChangeText={setTagline}
        maxLength={80}
      />

      <SectionLabel>Industry *</SectionLabel>
      <ChipRow>
        {INDUSTRIES.map((item) => (
          <Chip key={item} label={item} selected={industry === item} onPress={() => setIndustry(item)} />
        ))}
      </ChipRow>
      {industry === "Other" ? (
        <View style={{ marginTop: spacing.md }}>
          <TextField
            placeholder="Describe your industry"
            value={customIndustry}
            onChangeText={setCustomIndustry}
            maxLength={60}
          />
        </View>
      ) : null}

      <SectionLabel>Personality (pick up to 4)</SectionLabel>
      <ChipRow>
        {VIBES.map((vibe) => (
          <Chip
            key={vibe}
            label={vibe}
            selected={vibes.includes(vibe)}
            onPress={() => toggle(vibes, setVibes, vibe, 4)}
          />
        ))}
      </ChipRow>

      <SectionLabel>Color preferences (optional, up to 3)</SectionLabel>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: spacing.sm }}>
        {COLOR_CHOICES.map((color) => (
          <Swatch
            key={color}
            color={color}
            selected={colors.includes(color)}
            onPress={() => toggle(colors, setColors, color, 3)}
          />
        ))}
      </View>

      {error ? (
        <Text style={{ color: t.danger, marginTop: spacing.md, fontWeight: "600" }}>{error}</Text>
      ) : null}

      <View style={{ height: spacing.xl }} />
      <Button
        label={loading ? "Designing concepts..." : "Generate concepts"}
        onPress={submit}
        disabled={!canSubmit}
        loading={loading}
      />
    </Screen>
  );
}
