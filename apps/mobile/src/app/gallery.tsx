import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../lib/store";
import { generateWithFallback } from "../lib/api";
import { useLogoFonts } from "../lib/fonts";
import { LogoPreview } from "../components/LogoPreview";
import { Button, Card, EmptyState, Screen, Subtitle, Title, useTheme } from "../components/ui";
import { spacing } from "../theme";

export default function GalleryScreen() {
  const router = useRouter();
  const t = useTheme();
  const { state, setSession, createProject, clearSession } = useStore();
  const { draftBrief, concepts, conceptSource } = state.session;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shuffling, setShuffling] = useState(false);
  const fontsReady = useLogoFonts(concepts);

  if (!draftBrief || concepts.length === 0) {
    return (
      <Screen>
        <EmptyState
          title="No concepts yet"
          body="Start from the brief to generate logo concepts."
        />
        <Button label="Start a brief" onPress={() => router.replace("/brief")} />
      </Screen>
    );
  }

  const shuffle = async () => {
    setShuffling(true);
    try {
      const { specs, source } = await generateWithFallback(
        draftBrief,
        8,
        Math.floor(Math.random() * 1_000_000),
      );
      setSelectedId(null);
      setSession(draftBrief, specs, source);
    } finally {
      setShuffling(false);
    }
  };

  const usePrototype = () => {
    const spec = concepts.find((c) => c.id === selectedId);
    if (!spec) return;
    const project = createProject(draftBrief, spec);
    clearSession();
    router.replace(`/editor/${project.id}`);
  };

  return (
    <Screen>
      <Title>Pick your prototype</Title>
      <Subtitle>
        {conceptSource === "ai"
          ? "AI-designed concepts for your brief. Pick one to customize — you can change everything later."
          : "Concepts matched to your brief. Pick one to customize — you can change everything later."}
      </Subtitle>

      <View style={{ gap: spacing.md }}>
        {concepts.map((spec) => (
          <Card key={spec.id} onPress={() => setSelectedId(spec.id)} selected={selectedId === spec.id}>
            <LogoPreview spec={spec} height={130} fontsReady={fontsReady} />
            <Text style={{ marginTop: spacing.sm, fontSize: 12, color: t.textSecondary }}>
              {spec.layout.replace("-", " ")} · {spec.nameFont.family} ·{" "}
              {spec.markId === "monogram" ? "monogram" : spec.markId}
            </Text>
          </Card>
        ))}
      </View>

      <View style={{ height: spacing.lg }} />
      <View style={{ flexDirection: "row", gap: spacing.md }}>
        <Button
          label={shuffling ? "Shuffling..." : "More concepts"}
          variant="secondary"
          onPress={shuffle}
          loading={shuffling}
          style={{ flex: 1 }}
        />
        <Button
          label="Use this logo"
          onPress={usePrototype}
          disabled={!selectedId}
          style={{ flex: 1 }}
        />
      </View>
    </Screen>
  );
}
