import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Linking,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

import { api, media } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, Eyebrow, PrimaryButton, SecondaryButton } from "@/src/ui";
import { useDesign } from "@/src/store";

// ── AI VISUALISATION INTEGRATION POINT ───────────────────────────────────
// This screen is the polished prototype front-end for an on-body AI try-on.
// To connect real generation, send `photoUri` + current `selection` to a
// backend endpoint (e.g. POST /api/visualise) that runs an image model and
// returns an editorial composite URL, then render it in the result frame.
// ──────────────────────────────────────────────────────────────────────────

export default function Visualise() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selection, activeJacket } = useDesign();

  const [photo, setPhoto] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);
  const [blocked, setBlocked] = useState(false);

  const pick = async () => {
    setBlocked(false);
    const perm = await ImagePicker.getMediaLibraryPermissionsAsync();
    let status = perm.status;
    if (status !== "granted") {
      if (!perm.canAskAgain) {
        setBlocked(true);
        return;
      }
      const req = await ImagePicker.requestMediaLibraryPermissionsAsync();
      status = req.status;
      if (status !== "granted") {
        if (!req.canAskAgain) setBlocked(true);
        return;
      }
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.6,
      base64: true,
      allowsEditing: true,
      aspect: [3, 4],
    });
    if (!res.canceled && res.assets?.[0]) {
      const asset = res.assets[0];
      setPhoto(asset.uri);
      setDone(false);
      setResultName(null);
      runPreview(asset.base64 ?? null);
    }
  };

  const runPreview = async (base64: string | null) => {
    if (!base64) return;
    setProcessing(true);
    setFailed(false);
    try {
      const r = await api.post("/visualise", { image_base64: base64, selection });
      setResultName(r.media_name);
      setDone(true);
    } catch {
      setFailed(true);
      setDone(true); // fall back to editorial-framed original photo
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="See It On You" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxl }}>
        <View style={styles.intro}>
          <Eyebrow text="Visualise yourself" />
          <Text style={styles.title}>See it on you</Text>
          <Text style={styles.sub}>
            Upload a full-length photo and our AI styles you in your custom
            jacket — presented as a luxury editorial image.
          </Text>
        </View>

        {/* Frame */}
        <View style={styles.frame}>
          {resultName ? (
            <Image source={{ uri: media(resultName) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          ) : photo ? (
            <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
          ) : (
            <Image source={{ uri: media("hero_female") }} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} blurRadius={2} />
          )}
          <LinearGradient colors={["rgba(28,28,26,0.25)", "rgba(28,28,26,0)", "rgba(28,28,26,0.75)"]} locations={[0, 0.5, 1]} style={StyleSheet.absoluteFill} />

          {processing ? (
            <View style={styles.frameCenter} testID="visualise-processing">
              <ActivityIndicator color={colors.onSurfaceInverse} />
              <Text style={styles.processingText}>Styling you in your jacket…</Text>
              <Text style={styles.processingSub}>This can take a few seconds</Text>
            </View>
          ) : done ? (
            <View style={styles.resultBadge} testID="visualise-result">
              <Text style={styles.badgeLabel}>
                {resultName ? "AI TRY-ON" : "AI VISUALISATION · PREVIEW"}
              </Text>
              <Text style={styles.badgeTitle}>{activeJacket?.name ?? "Your custom jacket"}</Text>
              <Text style={styles.badgeMeta}>
                {selection.silhouette} · {selection.colour} · {selection.quilt}
              </Text>
              {failed ? (
                <Text style={styles.badgeMeta}>Showing your photo — tap retry to generate again</Text>
              ) : null}
            </View>
          ) : !photo ? (
            <View style={styles.frameCenter}>
              <Feather name="camera" size={28} color={colors.onSurfaceInverse} />
              <Text style={styles.processingText}>Your editorial preview appears here</Text>
            </View>
          ) : null}
        </View>

        {blocked ? (
          <View style={styles.blockedBox} testID="permission-blocked">
            <Text style={styles.blockedText}>
              Photo access is turned off. Enable it in Settings to preview your jacket.
            </Text>
            <Pressable testID="open-settings-button" onPress={() => Linking.openSettings()} style={styles.settingsBtn}>
              <Text style={styles.settingsText}>OPEN SETTINGS</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.actions}>
          <PrimaryButton
            testID="upload-photo-button"
            label={photo ? "TRY ANOTHER PHOTO" : "UPLOAD YOUR PHOTO"}
            onPress={pick}
          />
          <SecondaryButton
            testID="continue-checkout-button"
            label="CONTINUE TO CHECKOUT"
            onPress={() => router.push("/checkout")}
            style={{ marginTop: spacing.md }}
          />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  intro: { paddingHorizontal: spacing.lg, paddingTop: spacing.md, gap: spacing.sm },
  title: { fontFamily: fonts.display, fontSize: 40, color: colors.onSurface },
  sub: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: colors.onSurfaceSecondary, maxWidth: 360 },
  frame: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.xl,
    aspectRatio: 0.78,
    backgroundColor: colors.surfaceSecondary,
    overflow: "hidden",
    borderRadius: radius.md,
    justifyContent: "center",
  },
  frameCenter: { alignItems: "center", gap: spacing.md },
  processingText: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceInverse, letterSpacing: 0.5 },
  processingSub: { fontFamily: fonts.sans, fontSize: 11, color: "rgba(251,251,249,0.7)" },
  resultBadge: { position: "absolute", bottom: spacing.lg, left: spacing.lg, right: spacing.lg, gap: 4 },
  badgeLabel: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2, color: "rgba(251,251,249,0.75)" },
  badgeTitle: { fontFamily: fonts.display, fontSize: 28, color: colors.onSurfaceInverse },
  badgeMeta: { fontFamily: fonts.sans, fontSize: 13, color: "rgba(251,251,249,0.85)", textTransform: "capitalize" },
  blockedBox: { marginHorizontal: spacing.lg, marginTop: spacing.lg, padding: spacing.lg, backgroundColor: colors.surfaceSecondary, gap: spacing.md },
  blockedText: { fontFamily: fonts.sans, fontSize: 14, lineHeight: 21, color: colors.onSurfaceSecondary },
  settingsBtn: { alignSelf: "flex-start" },
  settingsText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2, color: colors.onSurface },
  actions: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
});
