import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  TextInput,
  Animated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api, media, Selection, ComputeResult } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, DualPrice, Eyebrow, PrimaryButton } from "@/src/ui";
import { useDesign } from "@/src/store";

type Opt = { id: string; label: string; hex?: string };
type Options = {
  silhouettes: Opt[];
  quilts: Opt[];
  colours: Opt[];
  craft_intensity: Opt[];
  personal_details: Opt[];
};

const CATS = [
  { key: "silhouette", label: "Silhouette", src: "silhouettes" },
  { key: "quilt", label: "Quilt", src: "quilts" },
  { key: "colour", label: "Colour", src: "colours" },
  { key: "craft", label: "Craft", src: "craft_intensity" },
  { key: "personal", label: "Detail", src: "personal_details" },
] as const;

// Each craft speaks its own pattern vocabulary — the Atelier adapts to the
// selected product's craft (same underlying ids keep pricing/made-ability valid).
const PATTERN_LABELS: Record<string, Record<string, string>> = {
  Ajrakh: { tab: "Block", geometric: "Trellis", patchwork: "Panel", abstract: "Scatter", organic: "Vine" },
  Kantha: { tab: "Stitch", geometric: "Running", patchwork: "Dense", abstract: "Free", organic: "Sparse" },
  Kalamkari: { tab: "Motif", geometric: "Border", patchwork: "Panel", abstract: "Narrative", organic: "Floral" },
};

const COLOUR_IMAGE: Record<string, string> = {
  ivory: "hero_male",
  sand: "hero_male",
  indigo: "hero_female",
  black: "jacket_front",
  rust: "jacket_reverse",  olive: "jacket_reverse",
};

export default function Atelier() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selection, setSelection, setCompute, activeJacket } = useDesign();

  const [options, setOptions] = useState<Options | null>(null);
  const [activeCat, setActiveCat] = useState<(typeof CATS)[number]["key"]>("silhouette");
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [computing, setComputing] = useState(false);
  const meter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get("/atelier/options").then(setOptions).catch(() => {});
  }, []);

  // recompute (debounced) whenever selection changes
  useEffect(() => {
    setComputing(true);
    const t = setTimeout(() => {
      api
        .post("/atelier/compute", selection)
        .then((r: ComputeResult) => {
          setResult(r);
          setCompute(r);
          Animated.timing(meter, {
            toValue: r.madeability.score / 100,
            duration: 500,
            useNativeDriver: false,
          }).start();
        })
        .catch(() => {})
        .finally(() => setComputing(false));
    }, 200);
    return () => clearTimeout(t);
  }, [selection, setCompute, meter]);

  const update = (key: keyof Selection, value: string) => {
    Haptics.selectionAsync();
    setSelection({ ...selection, [key]: value });
  };

  const applyFix = (fix: Partial<Selection>) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelection({ ...selection, ...fix });
  };

  const colourImg = useMemo(
    () => COLOUR_IMAGE[selection.colour] ?? "jacket_front",
    [selection.colour]
  );
  const colourHex =
    options?.colours.find((c) => c.id === selection.colour)?.hex ?? "#1C1C1A";

  if (!options) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.onSurface} />
      </View>
    );
  }

  const currentCat = CATS.find((c) => c.key === activeCat)!;
  const currentOpts = options[currentCat.src as keyof Options] as Opt[];
  const patternMap = PATTERN_LABELS[activeJacket?.craft_type ?? ""];
  const made = result?.madeability;
  const conflict = made?.conflicts?.[0];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="The Atelier" />

      {/* Jacket visual */}
      <View style={styles.visual}>
        <Image
          source={{ uri: media(colourImg) }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          transition={400}
        />
        {/* colour wash to hint tone change */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colourHex, opacity: 0.16 }]} />
        <LinearGradient
          colors={["rgba(28,28,26,0)", "rgba(28,28,26,0.55)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.visualTags}>
          <Text style={styles.visualTag}>{selection.silhouette.toUpperCase()}</Text>
          <Text style={styles.visualDot}>·</Text>
          <Text style={styles.visualTag}>{selection.quilt.toUpperCase()}</Text>
          <Text style={styles.visualDot}>·</Text>
          <Text style={styles.visualTag}>{selection.craft.toUpperCase()}</Text>
        </View>

        {selection.personal !== "none" && selection.personal_value ? (
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>{selection.personal_value}</Text>
          </View>
        ) : null}

        {/* Made-ability meter */}
        <View style={styles.meterWrap}>
          <View style={styles.meterHeader}>
            <Text style={styles.meterLabel}>MADE-ABILITY</Text>
            <Text
              testID="madeability-score"
              style={[styles.meterScore, { color: made && !made.makeable ? colors.warning : colors.onSurfaceInverse }]}
            >
              {made ? `${made.score}%` : "—"}
            </Text>
          </View>
          <View style={styles.meterTrack}>
            <Animated.View
              style={[
                styles.meterFill,
                {
                  width: meter.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }),
                  backgroundColor: made && !made.makeable ? colors.warning : colors.onSurfaceInverse,
                },
              ]}
            />
          </View>
          <Text style={styles.meterCopy} testID="madeability-copy">
            {made && !made.makeable
              ? "This combination pushes past our current craft capabilities."
              : "Your design fits our current craft and production capabilities."}
          </Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.panel}>
        {/* category tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catRow}
          contentContainerStyle={styles.catContent}
        >
          {CATS.map((c) => {
            const on = c.key === activeCat;
            return (
              <Pressable
                key={c.key}
                testID={`atelier-cat-${c.key}`}
                onPress={() => setActiveCat(c.key)}
                style={styles.catTab}
              >
                <Text style={[styles.catText, { color: on ? colors.onSurface : colors.onSurfaceTertiary }]}>
                  {c.key === "quilt" && patternMap ? patternMap.tab : c.label}
                </Text>
                {on ? <View style={styles.catUnderline} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
          {/* swatches */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatchRow}
          >
            {currentOpts.map((o) => {
              const on = (selection as any)[activeCat] === o.id;
              const isColour = activeCat === "colour";
              const optLabel = activeCat === "quilt" && patternMap ? patternMap[o.id] ?? o.label : o.label;
              return (
                <Pressable
                  key={o.id}
                  testID={`atelier-opt-${activeCat}-${o.id}`}
                  onPress={() => update(activeCat as keyof Selection, o.id)}
                  style={styles.swatchItem}
                >
                  <View
                    style={[
                      styles.swatch,
                      isColour ? { backgroundColor: o.hex } : styles.swatchText,
                      on && styles.swatchOn,
                    ]}
                  >
                    {!isColour ? (
                      <Text style={[styles.swatchInitial, on && { color: colors.onSurfaceInverse }]}>
                        {optLabel.charAt(0)}
                      </Text>
                    ) : null}
                    {on ? (
                      <View style={styles.swatchCheck}>
                        <Feather name="check" size={12} color={isColour ? "#fff" : colors.onSurface} />
                      </View>
                    ) : null}
                  </View>
                  <Text style={[styles.swatchLabel, on && { color: colors.onSurface, fontFamily: fonts.sansMedium }]}>
                    {optLabel}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* personal detail input */}
          {activeCat === "personal" && selection.personal !== "none" ? (
            <View style={styles.inputWrap}>
              <TextInput
                testID="personal-detail-input"
                value={selection.personal_value ?? ""}
                onChangeText={(v) => setSelection({ ...selection, personal_value: v })}
                placeholder={
                  selection.personal === "initials"
                    ? "Your initials (e.g. A.K.)"
                    : selection.personal === "date"
                    ? "A date (e.g. 08.2026)"
                    : "A symbol or word"
                }
                placeholderTextColor={colors.onSurfaceTertiary}
                maxLength={12}
                autoCapitalize="characters"
                style={styles.input}
                returnKeyType="done"
              />
            </View>
          ) : null}

          {/* Conflict / AI fix */}
          {conflict ? (
            <View style={styles.conflict} testID="madeability-conflict">
              <Text style={styles.conflictTitle}>A small conflict</Text>
              <Text style={styles.conflictBody}>{conflict.message}</Text>
              <Pressable
                testID="let-ai-fix-it"
                onPress={() => applyFix(conflict.fix)}
                style={({ pressed }) => [styles.fixBtn, pressed && { opacity: 0.85 }]}
              >
                <Feather name="zap" size={14} color={colors.onSurfaceInverse} />
                <Text style={styles.fixText}>LET AI FIX IT</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.editorialBlock} testID="ai-editorial">
              <Eyebrow text="The design moment" />
              <Text style={styles.editorial}>{result?.editorial}</Text>
            </View>
          )}
        </ScrollView>

        {/* Sticky footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <View style={styles.footerLeft}>
            {computing ? (
              <ActivityIndicator size="small" color={colors.onSurface} />
            ) : (
              <DualPrice
                inr={result?.price.total_inr ?? 8500}
                usd={result?.price.total_usd ?? 102}
                style={{ fontSize: 16 }}
              />
            )}
            <Text style={styles.footerNote}>
              {activeJacket ? `${activeJacket.name} · ${activeJacket.craft_type}` : "The Reversible Quilted Jacket"}
            </Text>
          </View>
          <PrimaryButton
            testID="atelier-continue-cta"
            label="VISUALISE"
            onPress={() => router.push("/visualise")}
            style={{ width: 132 }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  visual: {
    height: "42%",
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    justifyContent: "flex-end",
  },
  visualTags: {
    position: "absolute",
    top: spacing.lg,
    left: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  visualTag: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 1.5, color: colors.onSurfaceInverse },
  visualDot: { color: "rgba(251,251,249,0.5)" },
  monogram: {
    position: "absolute",
    top: spacing.xxxl,
    right: spacing.lg,
    borderWidth: 1,
    borderColor: "rgba(251,251,249,0.6)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  monogramText: { fontFamily: fonts.displayMedium, fontSize: 22, color: colors.onSurfaceInverse },
  meterWrap: { padding: spacing.lg },
  meterHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginBottom: spacing.sm },
  meterLabel: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2.5, color: "rgba(251,251,249,0.9)" },
  meterScore: { fontFamily: fonts.sansBold, fontSize: 24, letterSpacing: 0.5 },
  meterTrack: { height: 2, backgroundColor: "rgba(251,251,249,0.25)" },
  meterFill: { height: 2 },
  meterCopy: { fontFamily: fonts.sans, fontSize: 12, lineHeight: 17, color: "rgba(251,251,249,0.8)", marginTop: spacing.sm },
  panel: { flex: 1, backgroundColor: colors.surface },
  catRow: { flexGrow: 0, borderBottomWidth: 1, borderBottomColor: colors.divider },
  catContent: { paddingHorizontal: spacing.lg, gap: spacing.xl, alignItems: "center", height: 52 },
  catTab: { flexShrink: 0, height: 52, justifyContent: "center" },
  catText: { fontFamily: fonts.sansMedium, fontSize: 14, letterSpacing: 0.5 },
  catUnderline: { position: "absolute", bottom: 0, left: 0, right: 0, height: 2, backgroundColor: colors.onSurface },
  swatchRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },
  swatchItem: { alignItems: "center", gap: spacing.sm, width: 68, flexShrink: 0 },
  swatch: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchText: { backgroundColor: colors.surfaceSecondary },
  swatchOn: { borderColor: colors.onSurface, borderWidth: 2 },
  swatchInitial: { fontFamily: fonts.displaySemiBold, fontSize: 22, color: colors.onSurfaceSecondary },
  swatchCheck: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  swatchLabel: { fontFamily: fonts.sans, fontSize: 11, color: colors.onSurfaceTertiary },
  inputWrap: { paddingHorizontal: spacing.lg, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    fontFamily: fonts.sansMedium,
    fontSize: 15,
    color: colors.onSurface,
    letterSpacing: 1,
  },
  conflict: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    padding: spacing.lg,
    backgroundColor: colors.surfaceSecondary,
    borderLeftWidth: 2,
    borderLeftColor: colors.warning,
    gap: spacing.sm,
  },
  conflictTitle: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.5, color: colors.warning },
  conflictBody: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.onSurfaceSecondary },
  fixBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.xs,
  },
  fixText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 1.5, color: colors.onSurfaceInverse },
  editorialBlock: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.sm,
    paddingLeft: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
    gap: spacing.sm,
  },
  editorial: { fontFamily: fonts.displayMedium, fontSize: 21, lineHeight: 29, color: colors.onSurface },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    backgroundColor: colors.surface,
  },
  footerLeft: { flexShrink: 1, minWidth: 0, gap: 2 },
  footerNote: { fontFamily: fonts.sans, fontSize: 11, color: colors.onSurfaceTertiary },
});
