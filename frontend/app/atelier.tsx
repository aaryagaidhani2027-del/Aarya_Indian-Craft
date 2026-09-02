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
  { key: "quilt", label: "Technique", src: "quilts" },
  { key: "colour", label: "Colour", src: "colours" },
  { key: "craft", label: "Craft", src: "craft_intensity" },
  { key: "personal", label: "Detail", src: "personal_details" },
] as const;

// ---------------------------------------------------------------------------
// CRAFT-SPECIFIC LABELS
// ---------------------------------------------------------------------------
// Each craft speaks its own vocabulary for the same underlying quilt option.
// The Atelier adapts to the selected product's craft while keeping the same
// internal ids so pricing and made-ability remain valid.
const CRAFT_LABELS: Record<string, Record<string, string>> = {
  Quilting: { tab: "Pattern", geometric: "Geometric", patchwork: "Patchwork", abstract: "Abstract", organic: "Organic" },
  Ajrakh: { tab: "Block Print", geometric: "Fine Geometry", patchwork: "Dense Border", abstract: "Scattered Motif", organic: "Large Repeat" },
  Kantha: { tab: "Stitch", geometric: "Running Stitch", patchwork: "Dense Stitch", abstract: "Free Stitch", organic: "Narrative Stitch" },
};

// ---------------------------------------------------------------------------
// VISUAL CUSTOMISATION — preview images mapped to colour × craft combinations
// ---------------------------------------------------------------------------
// Uses existing generated assets. Colour hex wash is applied as a subtle tint.
const PREVIEW_IMAGES: Record<string, Record<string, string>> = {
  Quilting: {
    ivory: "quilt_still",
    sand: "quilt_women",
    indigo: "quilt_men",
    black: "jacket_front",
    rust: "jacket_reverse",
    olive: "patchwork_overshirt_unisex",
  },
  Ajrakh: {
    ivory: "ajrakh_texture",
    sand: "ajrakh_texture",
    indigo: "ajrakh_overshirt_men",
    black: "ajrakh_box_women",
    rust: "ajrakh_long_unisex",
    olive: "ajrakh_texture",
  },
  Kantha: {
    ivory: "kantha_overshirt_women",
    sand: "kantha_wrap_women",
    indigo: "kantha_workjacket_men",
    black: "kantha_workjacket_men",
    rust: "kantha_texture",
    olive: "kantha_texture",
  },
};

const COLOUR_TINT_OVERLAY: Record<string, number> = {
  black: 0.3,
  rust: 0.08,
};

// ---------------------------------------------------------------------------
// PREMIUM MADE-ABILITY
// ---------------------------------------------------------------------------
function MadeAbilityCard({
  score,
  makeable,
  conflicts,
  techniqueLabel,
  craftType,
  productionDays,
  onFix,
}: {
  score: number;
  makeable: boolean;
  conflicts: { message: string; fix: Partial<Selection>; fix_label: string }[];
  techniqueLabel?: string;
  craftType?: string;
  productionDays?: number;
  onFix?: (fix: Partial<Selection>) => void;
}) {
  if (makeable) {
    return (
      <View style={maStyles.card} testID="madeability-card">
        <Text style={maStyles.statusLabel}>YOUR DESIGN CAN BE MADE</Text>
        <View style={maStyles.scoreRow}>
          <Text style={maStyles.scoreBig} testID="madeability-score">{score}%</Text>
          <View style={maStyles.scoreLine} />
        </View>
        <View style={maStyles.details}>
          <View style={maStyles.detailRow}>
            <Text style={maStyles.detailKey}>Craft</Text>
            <Text style={maStyles.detailVal}>{craftType || "Hand quilting"}</Text>
          </View>
          <View style={maStyles.detailRow}>
            <Text style={maStyles.detailKey}>Technique</Text>
            <Text style={maStyles.detailVal}>{techniqueLabel || "Hand finishing"}</Text>
          </View>
          <View style={maStyles.detailRow}>
            <Text style={maStyles.detailKey}>Material</Text>
            <Text style={maStyles.detailVal}>Handloom cotton</Text>
          </View>
          <View style={maStyles.detailRow}>
            <Text style={maStyles.detailKey}>Estimated production</Text>
            <Text style={maStyles.detailVal}>{productionDays || 21} days</Text>
          </View>
          <View style={maStyles.detailRow}>
            <Text style={maStyles.detailKey}>Made in</Text>
            <Text style={maStyles.detailVal}>India</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[maStyles.card, maStyles.cardWarning]} testID="madeability-card-infeasible">
      <Text style={maStyles.statusLabelWarning}>NOT QUITE YET</Text>
      <View style={maStyles.scoreRow}>
        <Text style={[maStyles.scoreBig, { color: colors.warning }]} testID="madeability-score">{score}%</Text>
        <View style={[maStyles.scoreLine, { backgroundColor: colors.warning }]} />
      </View>
      {conflicts.map((c, i) => (
        <View key={i} style={maStyles.conflictBlock}>
          <Text style={maStyles.conflictMsg}>{c.message}</Text>
          <Pressable
            testID="let-ai-fix-it"
            onPress={() => onFix?.(c.fix)}
            style={({ pressed }) => [maStyles.fixBtn, pressed && { opacity: 0.85 }]}
          >
            <Feather name="zap" size={14} color={colors.onSurfaceInverse} />
            <Text style={maStyles.fixText}>LET THE ATELIER FIX IT</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

const maStyles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardWarning: {
    borderColor: colors.warning,
  },
  statusLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.success,
  },
  statusLabelWarning: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2.5,
    color: colors.warning,
  },
  scoreRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  scoreBig: {
    fontFamily: fonts.sansBlack,
    fontSize: 40,
    letterSpacing: -1,
    color: colors.onSurface,
  },
  scoreLine: {
    flex: 1,
    height: 2,
    backgroundColor: colors.success,
  },
  details: {
    gap: 0,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  detailKey: {
    fontFamily: fonts.sans,
    fontSize: 13,
    color: colors.onSurfaceTertiary,
  },
  detailVal: {
    fontFamily: fonts.sansMedium,
    fontSize: 13,
    color: colors.onSurface,
  },
  conflictBlock: {
    marginTop: spacing.md,
  },
  conflictMsg: {
    fontFamily: fonts.sans,
    fontSize: 14,
    lineHeight: 21,
    color: colors.onSurfaceSecondary,
    marginBottom: spacing.md,
  },
  fixBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  fixText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1.5,
    color: colors.onSurfaceInverse,
  },
});

// ---------------------------------------------------------------------------
// MAIN ATELIER COMPONENT
// ---------------------------------------------------------------------------
export default function Atelier() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selection, setSelection, setCompute, activeJacket } = useDesign();

  const [options, setOptions] = useState<Options | null>(null);
  const [optionsError, setOptionsError] = useState(false);
  const [activeCat, setActiveCat] = useState<(typeof CATS)[number]["key"]>("silhouette");
  const [result, setResult] = useState<ComputeResult | null>(null);
  const [computing, setComputing] = useState(false);

  // Image crossfade animation
  const imageOpacity = useRef(new Animated.Value(1)).current;
  const prevImageRef = useRef<string | null>(null);

  const loadOptions = () => {
    setOptionsError(false);
    api.get("/atelier/options")
      .then((data) => {
        setOptions(data);
        setOptionsError(false);
      })
      .catch(() => setOptionsError(true));
  };

  useEffect(() => {
    loadOptions();
  }, []);

  // Recompute (debounced) whenever selection changes
  useEffect(() => {
    setComputing(true);
    const t = setTimeout(() => {
      api
        .post("/atelier/compute", selection)
        .then((r: ComputeResult) => {
          setResult(r);
          setCompute(r);
        })
        .catch(() => {})
        .finally(() => setComputing(false));
    }, 200);
    return () => clearTimeout(t);
  }, [selection, setCompute]);

  const update = (key: keyof Selection, value: string) => {
    Haptics.selectionAsync();
    setSelection({ ...selection, [key]: value });
  };

  const applyFix = (fix: Partial<Selection>) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSelection({ ...selection, ...fix });
  };

  // Craft-specific labels
  const craftType = activeJacket?.craft_type ?? "Quilting";
  const craftLabels = CRAFT_LABELS[craftType] ?? CRAFT_LABELS.Quilting;

  // Preview image: mapped to colour × craft
  const previewImage = useMemo(() => {
    const craftMap = PREVIEW_IMAGES[craftType] ?? PREVIEW_IMAGES.Quilting;
    return craftMap[selection.colour] ?? "quilt_still";
  }, [selection.colour, craftType]);

  // Crossfade when preview image changes
  useEffect(() => {
    if (prevImageRef.current && prevImageRef.current !== previewImage) {
      imageOpacity.setValue(0);
      Animated.timing(imageOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();
    }
    prevImageRef.current = previewImage;
  }, [previewImage, imageOpacity]);

  const colourObj = options?.colours.find((c) => c.id === selection.colour);
  const colourHex = colourObj?.hex ?? "#1C1C1A";
  const tintOpacity = COLOUR_TINT_OVERLAY[selection.colour] ?? 0.08;

  const made = result?.madeability;
  const enhancedMade = made as any;

  if (!options) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        {optionsError ? (
          <>
            <Text style={styles.errorText}>The Atelier is temporarily unavailable.</Text>
            <PrimaryButton label="TRY AGAIN" onPress={loadOptions} />
          </>
        ) : (
          <ActivityIndicator color={colors.onSurface} />
        )}
      </View>
    );
  }

  const currentCat = CATS.find((c) => c.key === activeCat)!;
  const currentOpts = options[currentCat.src as keyof Options] as Opt[];

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="The Atelier" />

      {/* Jacket visual with crossfade */}
      <View style={styles.visual}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: imageOpacity }]}>
          <Image
            source={{ uri: media(previewImage) }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={0}
          />
        </Animated.View>
        {/* Colour tint wash */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colourHex, opacity: tintOpacity }]} />
        <LinearGradient
          colors={["rgba(28,28,26,0)", "rgba(28,28,26,0.55)"]}
          style={StyleSheet.absoluteFill}
        />

        {/* Active selection tags */}
        <View style={styles.visualTags}>
          <Text style={styles.visualTag}>{selection.silhouette.toUpperCase()}</Text>
          <Text style={styles.visualDot}>·</Text>
          <Text style={styles.visualTag}>
            {(craftLabels as any)[selection.quilt] ?? selection.quilt.toUpperCase()}
          </Text>
          <Text style={styles.visualDot}>·</Text>
          <Text style={styles.visualTag}>{selection.craft.toUpperCase()}</Text>
        </View>

        {/* Monogram */}
        {selection.personal !== "none" && selection.personal_value ? (
          <View style={styles.monogram}>
            <Text style={styles.monogramText}>{selection.personal_value}</Text>
          </View>
        ) : null}

        {/* Made-ability — premium card at bottom of visual */}
        {made && (
          <View style={styles.meterWrap}>
            <MadeAbilityCard
              score={made.score}
              makeable={made.makeable}
              conflicts={made.conflicts}
              techniqueLabel={enhancedMade?.technique_label}
              craftType={enhancedMade?.craft_type}
              productionDays={enhancedMade?.production_days}
              onFix={applyFix}
            />
          </View>
        )}
      </View>

      {/* Controls */}
      <View style={styles.panel}>
        {/* Category tabs — craft-specific labels */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.catRow}
          contentContainerStyle={styles.catContent}
        >
          {CATS.map((c) => {
            const on = c.key === activeCat;
            const tabLabel = c.key === "quilt" ? craftLabels.tab : c.label;
            return (
              <Pressable
                key={c.key}
                testID={`atelier-cat-${c.key}`}
                onPress={() => setActiveCat(c.key)}
                style={styles.catTab}
              >
                <Text style={[styles.catText, { color: on ? colors.onSurface : colors.onSurfaceTertiary }]}>
                  {tabLabel}
                </Text>
                {on ? <View style={styles.catUnderline} /> : null}
              </Pressable>
            );
          })}
        </ScrollView>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.md }}>
          {/* Swatches — craft-specific labels for quilt options */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatchRow}
          >
            {currentOpts.map((o) => {
              const on = (selection as any)[activeCat] === o.id;
              const isColour = activeCat === "colour";
              const optLabel = activeCat === "quilt"
                ? (craftLabels as any)[o.id] ?? o.label
                : o.label;
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

          {/* Personal detail input */}
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

          {/* Editorial copy (when no conflicts) */}
          {!made?.conflicts?.length ? (
            <View style={styles.editorialBlock} testID="ai-editorial">
              <Eyebrow text="The design moment" />
              <Text style={styles.editorial}>{result?.editorial}</Text>
            </View>
          ) : null}
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
  center: { alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.lg },
  errorText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 23, color: colors.onSurfaceSecondary, textAlign: "center", marginBottom: spacing.lg },
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
