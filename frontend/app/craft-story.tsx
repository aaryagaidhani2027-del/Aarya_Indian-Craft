import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";

import { api, API, media } from "@/src/api";
import { colors, fonts, spacing } from "@/src/theme";
import { BackHeader, Eyebrow, PrimaryButton } from "@/src/ui";

type Story = {
  title: string;
  heading: string;
  body: string;
  passport: Record<string, string>;
};

function fmt(sec: number) {
  if (!sec || isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

const WAVE = [8, 14, 20, 12, 24, 16, 10, 22, 18, 26, 14, 9, 20, 15, 23, 11, 19, 25, 13, 17, 21, 10, 16, 22, 12, 18, 14, 8];

export default function CraftStory() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [story, setStory] = useState<Story | null>(null);
  const [configured, setConfigured] = useState(false);
  const [ready, setReady] = useState(false);

  const player = useAudioPlayer(configured ? { uri: `${API}/craft-story/audio` } : null);
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    api.get("/craft-story").then(setStory).catch(() => {});
    api
      .get("/craft-story/audio/status")
      .then((s) => setConfigured(!!s.configured))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);

  const toggle = () => {
    if (!player) return;
    if (status.playing) player.pause();
    else {
      if (status.didJustFinish || (status.duration && status.currentTime >= status.duration)) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const progress = status.duration ? status.currentTime / status.duration : 0;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + spacing.xxxl }}>
        {/* Artisan hero */}
        <View style={{ height: 420 }}>
          <Image source={{ uri: media("artisan") }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
          <LinearGradient colors={["rgba(28,28,26,0.4)", "rgba(28,28,26,0)", "rgba(28,28,26,0.9)"]} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
          <View style={{ paddingTop: insets.top }}>
            <BackHeader light />
          </View>
          <View style={styles.heroBottom}>
            <Eyebrow text="Know what you're wearing" color="rgba(251,251,249,0.75)" />
            <Text style={styles.heading}>{story?.heading ?? "The craft behind the piece"}</Text>
          </View>
        </View>

        {/* Audio player */}
        <View style={styles.player}>
          {!ready ? (
            <ActivityIndicator color={colors.onSurface} />
          ) : (
            <>
              <Pressable
                testID="audio-play-button"
                onPress={toggle}
                disabled={!configured}
                style={({ pressed }) => [styles.playBtn, pressed && { opacity: 0.85 }, !configured && { opacity: 0.4 }]}
              >
                <Feather name={status.playing ? "pause" : "play"} size={22} color={colors.onSurfaceInverse} />
              </Pressable>
              <View style={styles.playerRight}>
                <Text style={styles.playerLabel}>LISTEN TO THE STORY</Text>
                <View style={styles.waveRow}>
                  {WAVE.map((h, i) => (
                    <View
                      key={i}
                      style={[
                        styles.waveBar,
                        { height: h, backgroundColor: i / WAVE.length <= progress ? colors.onSurface : colors.surfaceTertiary },
                      ]}
                    />
                  ))}
                </View>
                <View style={styles.timeRow}>
                  <Text style={styles.time}>{fmt(status.currentTime)}</Text>
                  <Text style={styles.time}>
                    {configured ? fmt(status.duration) : "Narration by ElevenLabs"}
                  </Text>
                </View>
              </View>
            </>
          )}
        </View>
        {ready && !configured ? (
          <Text style={styles.audioNote} testID="audio-config-note">
            Voiceover is prepared — it plays here once the ElevenLabs voice is connected.
          </Text>
        ) : null}

        {/* Body */}
        <View style={styles.body}>
          <Eyebrow text="The story behind the stitch" />
          <Text style={styles.bodyText}>{story?.body}</Text>
        </View>

        {/* Passport */}
        {story?.passport ? (
          <View style={styles.passport}>
            <Eyebrow text="Your piece" />
            <Text style={styles.passportTitle}>Product Passport</Text>
            <View style={styles.pieceBadge}>
              <Text style={styles.pieceText}>PIECE 001 / QUILT / 2026</Text>
            </View>
            {Object.entries({
              Craft: story.passport.craft,
              Technique: story.passport.technique,
              Material: story.passport.material,
              Origin: story.passport.origin,
              Maker: story.passport.maker,
              "Production time": story.passport.production_time,
            }).map(([k, v]) => (
              <View key={k} style={styles.pRow}>
                <Text style={styles.pKey}>{k}</Text>
                <Text style={styles.pVal}>{v}</Text>
              </View>
            ))}
          </View>
        ) : null}

        <View style={{ paddingHorizontal: spacing.lg, marginTop: spacing.xxl }}>
          <PrimaryButton testID="craft-customise-cta" label="MAKE IT YOURS" onPress={() => router.push("/atelier")} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  heroBottom: { position: "absolute", bottom: spacing.xl, left: spacing.lg, right: spacing.lg, gap: spacing.sm },
  heading: { fontFamily: fonts.display, fontSize: 38, lineHeight: 40, color: colors.onSurfaceInverse },
  player: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  playerRight: { flex: 1, gap: spacing.sm },
  playerLabel: { fontFamily: fonts.sansMedium, fontSize: 11, letterSpacing: 2, color: colors.onSurface },
  scrubTrack: { height: 2, backgroundColor: colors.divider },
  waveRow: { flexDirection: "row", alignItems: "center", gap: 3, height: 28 },
  waveBar: { width: 2.5, borderRadius: 2 },
  pieceBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginBottom: spacing.md,
  },
  pieceText: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2, color: colors.onSurfaceTertiary },
  timeRow: { flexDirection: "row", justifyContent: "space-between" },
  time: { fontFamily: fonts.sans, fontSize: 11, color: colors.onSurfaceTertiary },
  audioNote: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.onSurfaceTertiary,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    lineHeight: 18,
  },
  body: { paddingHorizontal: spacing.lg, marginTop: spacing.xxl },
  bodyText: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 26, color: colors.onSurfaceSecondary, marginTop: spacing.md },
  passport: {
    marginTop: spacing.xxxl,
    marginHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    gap: spacing.sm,
  },
  passportTitle: { fontFamily: fonts.display, fontSize: 30, color: colors.onSurface, marginBottom: spacing.md },
  pRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  pKey: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceTertiary },
  pVal: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.onSurface, maxWidth: "60%", textAlign: "right" },
});
