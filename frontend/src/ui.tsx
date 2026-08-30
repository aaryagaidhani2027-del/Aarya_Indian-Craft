import React from "react";
import {
  Text,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { colors, fonts, spacing, radius } from "@/src/theme";

export function formatINR(n: number) {
  return `₹ ${n.toLocaleString("en-IN")}`;
}
export function formatUSD(n: number) {
  return `$ ${n.toLocaleString("en-US")}`;
}

export function DualPrice({
  inr,
  usd,
  style,
  color = colors.onSurface,
}: {
  inr: number;
  usd: number;
  style?: TextStyle;
  color?: string;
}) {
  return (
    <Text style={[styles.price, { color }, style]} testID="dual-price">
      {formatINR(inr)}
      <Text style={{ color: colors.brandSecondary }}>{"   •   "}</Text>
      {formatUSD(usd)}
    </Text>
  );
}

export function PrimaryButton({
  label,
  onPress,
  testID,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.primaryBtn,
        (disabled || loading) && { opacity: 0.5 },
        pressed && { opacity: 0.85 },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onSurfaceInverse} />
      ) : (
        <Text style={styles.primaryLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  testID,
  style,
  light,
}: {
  label: string;
  onPress: () => void;
  testID?: string;
  style?: ViewStyle;
  light?: boolean;
}) {
  const c = light ? colors.onSurfaceInverse : colors.onSurface;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.secondaryBtn,
        { borderColor: c },
        pressed && { opacity: 0.6 },
        style,
      ]}
    >
      <Text style={[styles.secondaryLabel, { color: c }]}>{label}</Text>
    </Pressable>
  );
}

export function BackHeader({
  title,
  onBack,
  light,
  testID,
}: {
  title?: string;
  onBack?: () => void;
  light?: boolean;
  testID?: string;
}) {
  const router = useRouter();
  const c = light ? colors.onSurfaceInverse : colors.onSurface;
  return (
    <View style={styles.header} testID={testID}>
      <Pressable
        testID="back-button"
        onPress={onBack ?? (() => router.back())}
        hitSlop={12}
        style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.5 }]}
      >
        <Feather name="arrow-left" size={22} color={c} />
      </Pressable>
      {title ? (
        <Text style={[styles.headerTitle, { color: c }]} numberOfLines={1}>
          {title}
        </Text>
      ) : null}
      <View style={styles.backBtn} />
    </View>
  );
}

export function Eyebrow({ text, color = colors.brandSecondary, style }: { text: string; color?: string; style?: TextStyle }) {
  return <Text style={[styles.eyebrow, { color }, style]}>{text}</Text>;
}

const styles = StyleSheet.create({
  price: {
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    letterSpacing: 0.2,
  },
  primaryBtn: {
    backgroundColor: colors.brand,
    height: 56,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  primaryLabel: {
    color: colors.onSurfaceInverse,
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 2,
  },
  secondaryBtn: {
    height: 56,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  secondaryLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    letterSpacing: 2,
  },
  header: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
  },
  backBtn: { width: 40, height: 40, alignItems: "flex-start", justifyContent: "center" },
  headerTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    flex: 1,
    textAlign: "center",
  },
  eyebrow: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 3,
    textTransform: "uppercase",
  },
});
