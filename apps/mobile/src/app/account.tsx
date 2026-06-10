import React, { useState } from "react";
import { Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "../lib/auth";
import { Button, Card, Screen, Subtitle, TextField, Title, useTheme } from "../components/ui";
import { spacing } from "../theme";

export default function AccountScreen() {
  const router = useRouter();
  const t = useTheme();
  const auth = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  if (!auth.configured) {
    return (
      <Screen>
        <Title>Account</Title>
        <Subtitle>
          Cloud sync is not configured in this build. Your logos are saved on this device and keep
          working offline. To enable accounts and cross-device sync, set
          EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY.
        </Subtitle>
        <Button label="Back" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  if (auth.user) {
    return (
      <Screen>
        <Title>Account</Title>
        <Card>
          <Text style={{ color: t.text, fontWeight: "700", fontSize: 16 }}>{auth.user.email}</Text>
          <Text style={{ color: t.textSecondary, fontSize: 13, marginTop: 4 }}>
            Your logos sync automatically across devices.
          </Text>
        </Card>
        <View style={{ height: spacing.lg }} />
        <Button label="Sign out" variant="danger" onPress={() => void auth.signOut()} />
      </Screen>
    );
  }

  const submit = async () => {
    const ok =
      mode === "signin" ? await auth.signIn(email.trim(), password) : await auth.signUp(email.trim(), password);
    if (ok) router.back();
  };

  return (
    <Screen>
      <Title>{mode === "signin" ? "Sign in" : "Create account"}</Title>
      <Subtitle>
        {mode === "signin"
          ? "Sign in to sync your logos across web, iOS, and Android. Logos made as a guest are merged into your account."
          : "Create an account to keep your logos backed up and available everywhere."}
      </Subtitle>
      <TextField
        label="Email"
        placeholder="you@example.com"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextField
        label="Password"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      {auth.error ? (
        <Text style={{ color: t.danger, marginBottom: spacing.md, fontWeight: "600" }}>{auth.error}</Text>
      ) : null}
      <Button
        label={mode === "signin" ? "Sign in" : "Sign up"}
        onPress={() => void submit()}
        loading={auth.busy}
        disabled={!email.trim() || password.length < 6}
      />
      <View style={{ height: spacing.md }} />
      <Button
        label={mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        variant="ghost"
        onPress={() => setMode(mode === "signin" ? "signup" : "signin")}
      />
    </Screen>
  );
}
