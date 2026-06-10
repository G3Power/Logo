import React from "react";
import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../lib/store";
import { useAuth } from "../lib/auth";
import { useLogoFonts } from "../lib/fonts";
import { LogoPreview } from "../components/LogoPreview";
import { Button, Card, EmptyState, Screen, Subtitle, Title, useTheme } from "../components/ui";
import { spacing } from "../theme";

export default function HomeScreen() {
  const router = useRouter();
  const t = useTheme();
  const { state, deleteProject } = useStore();
  const auth = useAuth();
  const specs = state.projects.map((p) => p.spec);
  const fontsReady = useLogoFonts(specs);

  return (
    <Screen>
      <Title>Your logos</Title>
      <Subtitle>
        Describe your business, creator brand, or idea and get unique logo concepts you can refine
        and export — complete with app icons.
      </Subtitle>

      <Button label="Create a new logo" onPress={() => router.push("/brief")} />

      <View style={{ height: spacing.lg }} />

      {!state.hydrated ? null : state.projects.length === 0 ? (
        <EmptyState
          title="No logos yet"
          body="Tap 'Create a new logo' to generate your first set of concepts."
        />
      ) : (
        <View style={{ gap: spacing.md }}>
          {state.projects.map((project) => (
            <Card key={project.id} onPress={() => router.push(`/editor/${project.id}`)}>
              <LogoPreview spec={project.spec} height={120} fontsReady={fontsReady} />
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: spacing.sm,
                }}
              >
                <View>
                  <Text style={{ fontWeight: "700", fontSize: 16, color: t.text }}>
                    {project.brief.brandName}
                  </Text>
                  <Text style={{ fontSize: 12, color: t.textSecondary }}>
                    {project.brief.industry} · edited {new Date(project.updatedAt).toLocaleDateString()}
                  </Text>
                </View>
                <Pressable onPress={() => deleteProject(project.id)} hitSlop={8}>
                  <Text style={{ color: t.danger, fontWeight: "600", fontSize: 13 }}>Delete</Text>
                </Pressable>
              </View>
            </Card>
          ))}
        </View>
      )}

      <View style={{ height: spacing.xl }} />
      <Pressable onPress={() => router.push("/account")}>
        <Text style={{ color: t.accent, fontWeight: "600", textAlign: "center" }}>
          {auth.user ? `Signed in as ${auth.user.email}` : "Sign in to sync your logos"}
        </Text>
      </Pressable>
    </Screen>
  );
}
