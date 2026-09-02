import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { api, media, INR_TO_USD } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, DualPrice, Eyebrow, PrimaryButton, SecondaryButton } from "@/src/ui";
import { useDesign } from "@/src/store";

export default function DnaResult() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dna, profileId, setProfileId } = useDesign();
  const fade = useRef(new Animated.Value(0)).current;

  // "Why This Craft?" explanation
  const [craftExplanation, setCraftExplanation] = useState<string | null>(null);
  const craftFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, [fade]);

  // Fetch "Why This Craft?" explanation once DNA result is available
  useEffect(() => {
    if (!dna) return;
    const craft = dna.recommended_craft ?? dna.craft_affinity?.split(" ")[0] ?? "Quilting";
    // Map craft_affinity strings to proper craft names
    const craftMap: Record<string, string> = {
      "Geometric quilting": "Quilting",
      "Kantha stitching": "Kantha",
      "Ajrakh block print": "Ajrakh",
      "Quilting": "Quilting",
      "Ajrakh": "Ajrakh",
      "Kantha": "Kantha",
    };
    const craftName = craftMap[craft] ?? craft;
    const pKey = profileId ?? (dna as any).profile_key ?? "quiet_architect";
    api
      .post("/dna/craft-explanation", { profile_id: pKey, craft: craftName })
      .then((res) => {
        setCraftExplanation(res.explanation);
        // Store profile_id for later screens
        if (!profileId) setProfileId(pKey);
        // Fade in the explanation
        Animated.timing(craftFade, { toValue: 1, duration: 600, useNativeDriver: true }).start();
      })
      .catch(() => {
        // Silent fail — section simply won't show
      });
  }, [dna, profileId, setProfileId, craftFade]);

  if (!dna) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <BackHeader title="Your Design DNA" />
        <View style={styles.center}>
          <Text style={styles.body}>Take the questionnaire to reveal your DNA.</Text>
          <PrimaryButton testID="start-dna" label="FIND YOUR DESIGN DNA" onPress={() => router.replace("/dna")} />
        </View>
      </View>
    );
  }

  const facts = [
    { k: "Preferred palette", v: dna.palette },
    { k: "Preferred silhouette", v: dna.silhouette },
    { k: "Craft affinity", v: dna.craft_affinity },
  ];

  const craftName = dna.recommended_craft ?? dna.craft_affinity?.split(" ")[0] ?? "Quilting";
  const craftMap: Record<string, string> = {
    "Geometric quilting": "Quilting",
    "Kantha stitching": "Kantha",
    "Ajrakh block print": "Ajrakh",
  };
  const resolvedCraft = craftMap[craftName] ?? craftName;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}>
        <View style={{ paddingTop: insets.top }}>
          <BackHeader />
        </View>

        <Animated.View style={{ opacity: fade }}>
          {/* Design DNA Result */}
          <View style={styles.hero}>
            <Eyebrow text="Your design DNA" />
            <Text style={styles.name}>{dna.name}</Text>
            <Text style={styles.desc}>{dna.description}</Text>
          </View>

          <View style={styles.tagRow}>
            {dna.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>{t}</Text>
              </View>
            ))}
          </View>

          <View style={styles.facts}>
            {facts.map((f) => (
              <View key={f.k} style={styles.factRow}>
                <Text style={styles.factKey}>{f.k}</Text>
                <Text style={styles.factVal}>{f.v}</Text>
              </View>
            ))}
          </View>

          {/* WHY THIS CRAFT? */}
          <Animated.View style={[styles.craftWhy, { opacity: craftFade }]} testID="why-this-craft">
            <View style={styles.craftWhyDivider} />
            <Eyebrow text={`Why ${resolvedCraft}?`} />
            {craftExplanation ? (
              <Text style={styles.craftWhyText}>{craftExplanation}</Text>
            ) : (
              <Text style={styles.craftWhyText}>
                Your Design DNA maps naturally to {resolvedCraft.toLowerCase()}'s craft language.
              </Text>
            )}
            <Pressable
              testID="see-craft-story"
              onPress={() => router.push({ pathname: "/craft-story", params: { craft: resolvedCraft } })}
              style={({ pressed }) => [styles.craftWhyLink, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.craftWhyLinkText}>SEE THE CRAFT →</Text>
            </Pressable>
          </Animated.View>

          {/* AI Recommendation */}
          <View style={styles.recHeader}>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={13} color={colors.onSurfaceInverse} />
              <Text style={styles.aiBadgeText}>AI TRANSLATED YOUR TASTE</Text>
            </View>
            <Text style={styles.recTitle}>Your edit</Text>
            <Text style={styles.recSub}>
              We read your Design DNA and matched it to our craft catalogue — no invented products, only
              pieces we can actually make.
            </Text>
          </View>

          <View style={styles.recList}>
            {dna.recommended_jackets?.map((j) => (
              <Pressable
                key={j.id}
                testID={`rec-jacket-${j.id}`}
                onPress={() => router.push(`/product/${j.id}`)}
                style={({ pressed }) => [styles.recRow, pressed && { opacity: 0.9 }]}
              >
                <Image source={{ uri: media(j.image) }} style={styles.recImg} contentFit="cover" transition={300} />
                <View style={styles.recInfo}>
                  <Text style={styles.recName} numberOfLines={1}>{j.name}</Text>
                  <DualPrice inr={j.price_inr} usd={Math.round(j.price_inr * INR_TO_USD)} style={{ fontSize: 12 }} />
                  {j.reason ? <Text style={styles.recReason}>{j.reason}</Text> : null}
                </View>
              </Pressable>
            ))}
          </View>

          <View style={styles.ctas}>
            <PrimaryButton
              testID="dna-customise-cta"
              label="MAKE IT YOURS"
              onPress={() => router.push(`/product/${dna.recommended_jackets?.[0]?.id ?? "j01"}`)}
            />
            <SecondaryButton
              testID="dna-explore-cta"
              label="EXPLORE THE COLLECTION"
              onPress={() => router.push("/catalogue")}
              style={{ marginTop: spacing.md }}
            />
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.lg, padding: spacing.lg },
  body: { fontFamily: fonts.sans, fontSize: 15, color: colors.onSurfaceSecondary, textAlign: "center" },
  hero: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  name: { fontFamily: fonts.displaySemiBold, fontSize: 48, lineHeight: 50, color: colors.onSurface, marginTop: spacing.sm },
  desc: { fontFamily: fonts.sans, fontSize: 16, lineHeight: 26, color: colors.onSurfaceSecondary, marginTop: spacing.lg },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  tag: {
    borderWidth: 1,
    borderColor: colors.borderStrong,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  tagText: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1, color: colors.onSurface },
  facts: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl },
  factRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  factKey: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceTertiary },
  factVal: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.onSurface },

  // WHY THIS CRAFT?
  craftWhy: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xxxl,
    gap: spacing.sm,
  },
  craftWhyDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginBottom: spacing.sm,
  },
  craftWhyText: {
    fontFamily: fonts.displayMedium,
    fontSize: 20,
    lineHeight: 30,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  craftWhyLink: {
    marginTop: spacing.md,
    alignSelf: "flex-start",
  },
  craftWhyLinkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.onSurface,
  },

  // AI Recommendation
  recHeader: { paddingHorizontal: spacing.lg, marginTop: spacing.xxxl, gap: spacing.sm },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    alignSelf: "flex-start",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  aiBadgeText: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 1.5, color: colors.onSurfaceInverse },
  recTitle: { fontFamily: fonts.display, fontSize: 30, color: colors.onSurface, marginTop: spacing.xs },
  recSub: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 22, color: colors.onSurfaceSecondary },
  recList: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, gap: spacing.lg },
  recRow: { flexDirection: "row", gap: spacing.lg },
  recImg: { width: 96, aspectRatio: 0.8, backgroundColor: colors.surfaceSecondary },
  recInfo: { flex: 1, justifyContent: "center", gap: 4 },
  recName: { fontFamily: fonts.sansMedium, fontSize: 16, color: colors.onSurface },
  recReason: { fontFamily: fonts.sans, fontSize: 13, lineHeight: 19, color: colors.onSurfaceTertiary },
  ctas: { paddingHorizontal: spacing.lg, marginTop: spacing.xxxl },
});
