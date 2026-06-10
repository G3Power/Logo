import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { maxContentWidth, palette, radius, spacing, type ThemeColors } from "../theme";

export function useTheme(): ThemeColors {
  const scheme = useColorScheme();
  return scheme === "dark" ? palette.dark : palette.light;
}

export function Screen({
  children,
  scroll = true,
  padded = true,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  padded?: boolean;
}) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const inner = (
    <View
      style={{
        width: "100%",
        maxWidth: maxContentWidth,
        alignSelf: "center",
        padding: padded ? spacing.md : 0,
        paddingBottom: spacing.xxl,
        flexGrow: 1,
      }}
    >
      {children}
    </View>
  );
  if (!scroll) {
    return (
      <View style={{ flex: 1, backgroundColor: t.background, paddingBottom: insets.bottom }}>
        {inner}
      </View>
    );
  }
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.background }}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: insets.bottom }}
      keyboardShouldPersistTaps="handled"
    >
      {inner}
    </ScrollView>
  );
}

export function Title({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return <Text style={{ fontSize: 28, fontWeight: "800", color: t.text, marginBottom: spacing.sm }}>{children}</Text>;
}

export function Subtitle({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text style={{ fontSize: 15, color: t.textSecondary, marginBottom: spacing.lg, lineHeight: 21 }}>
      {children}
    </Text>
  );
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  const t = useTheme();
  return (
    <Text
      style={{
        fontSize: 12,
        fontWeight: "700",
        letterSpacing: 1.2,
        textTransform: "uppercase",
        color: t.textSecondary,
        marginTop: spacing.lg,
        marginBottom: spacing.sm,
      }}
    >
      {children}
    </Text>
  );
}

export function Card({
  children,
  style,
  onPress,
  selected,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  selected?: boolean;
}) {
  const t = useTheme();
  const base: ViewStyle = {
    backgroundColor: t.surface,
    borderRadius: radius.lg,
    borderWidth: selected ? 2 : 1,
    borderColor: selected ? t.accent : t.border,
    padding: spacing.md,
  };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [base, { opacity: pressed ? 0.85 : 1 }, style]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[base, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTheme();
  const bg =
    variant === "primary" ? t.accent : variant === "danger" ? t.danger : variant === "secondary" ? t.surfaceAlt : "transparent";
  const fg = variant === "primary" || variant === "danger" ? "#FFFFFF" : variant === "ghost" ? t.accent : t.text;
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        {
          backgroundColor: bg,
          borderRadius: radius.md,
          paddingVertical: 13,
          paddingHorizontal: spacing.lg,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: spacing.sm,
          opacity: disabled ? 0.45 : pressed ? 0.85 : 1,
        },
        style,
      ]}
    >
      {loading ? <ActivityIndicator size="small" color={fg} /> : null}
      <Text style={{ color: fg, fontWeight: "700", fontSize: 15 }}>{label}</Text>
    </Pressable>
  );
}

export function TextField(props: TextInputProps & { label?: string }) {
  const t = useTheme();
  const { label, style, ...rest } = props;
  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? (
        <Text style={{ fontSize: 13, fontWeight: "600", color: t.textSecondary, marginBottom: 6 }}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={t.textSecondary}
        {...rest}
        style={[
          {
            backgroundColor: t.surface,
            borderWidth: 1,
            borderColor: t.border,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: 12,
            fontSize: 16,
            color: t.text,
          },
          style,
        ]}
      />
    </View>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected?: boolean;
  onPress: () => void;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: selected ? t.accent : t.surfaceAlt,
        borderRadius: 999,
        paddingHorizontal: 14,
        paddingVertical: 8,
        opacity: pressed ? 0.8 : 1,
      })}
    >
      <Text style={{ color: selected ? "#FFFFFF" : t.text, fontWeight: "600", fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function ChipRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.chipRow}>{children}</View>;
}

export function Stepper({
  label,
  value,
  onChange,
  min,
  max,
  step = 0.1,
  format = (v: number) => v.toFixed(1),
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  format?: (v: number) => string;
}) {
  const t = useTheme();
  const adjust = (dir: 1 | -1) => {
    const next = Math.round((value + dir * step) * 100) / 100;
    onChange(Math.min(max, Math.max(min, next)));
  };
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 }}>
      <Text style={{ color: t.text, fontSize: 15, fontWeight: "500" }}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: spacing.sm }}>
        <Pressable onPress={() => adjust(-1)} style={[styles.stepBtn, { backgroundColor: t.surfaceAlt }]}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>−</Text>
        </Pressable>
        <Text style={{ color: t.textSecondary, width: 44, textAlign: "center", fontVariant: ["tabular-nums"] }}>
          {format(value)}
        </Text>
        <Pressable onPress={() => adjust(1)} style={[styles.stepBtn, { backgroundColor: t.surfaceAlt }]}>
          <Text style={{ color: t.text, fontSize: 18, fontWeight: "700" }}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function Swatch({
  color,
  selected,
  onPress,
  size = 34,
}: {
  color: string;
  selected?: boolean;
  onPress?: () => void;
  size?: number;
}) {
  const t = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        borderWidth: selected ? 3 : 1,
        borderColor: selected ? t.accent : t.border,
      }}
    />
  );
}

export function EmptyState({ title, body }: { title: string; body: string }) {
  const t = useTheme();
  return (
    <View style={{ alignItems: "center", paddingVertical: spacing.xxl, gap: spacing.sm }}>
      <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>{title}</Text>
      <Text style={{ fontSize: 14, color: t.textSecondary, textAlign: "center", maxWidth: 320 }}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  stepBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
