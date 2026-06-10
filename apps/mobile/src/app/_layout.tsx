import React from "react";
import { useColorScheme } from "react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StoreProvider } from "../lib/store";
import { AuthProvider } from "../lib/auth";
import { palette } from "../theme";

export default function RootLayout() {
  const scheme = useColorScheme();
  const t = scheme === "dark" ? palette.dark : palette.light;

  return (
    <StoreProvider>
      <AuthProvider>
        <StatusBar style={scheme === "dark" ? "light" : "dark"} />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: t.surface },
            headerTintColor: t.text,
            headerTitleStyle: { fontWeight: "700" },
            contentStyle: { backgroundColor: t.background },
          }}
        >
          <Stack.Screen name="index" options={{ title: "Logomaker" }} />
          <Stack.Screen name="brief" options={{ title: "New logo" }} />
          <Stack.Screen name="gallery" options={{ title: "Concepts" }} />
          <Stack.Screen name="editor/[id]" options={{ title: "Customize" }} />
          <Stack.Screen name="export/[id]" options={{ title: "App icon & export" }} />
          <Stack.Screen name="account" options={{ title: "Account" }} />
        </Stack>
      </AuthProvider>
    </StoreProvider>
  );
}
