import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { api } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, Eyebrow } from "@/src/ui";
import { useDesign } from "@/src/store";

type Question = {
  id: string;
  title: string;
  subtitle?: string;
  options: { id: string; label: string }[];
};

const PALETTE_DOTS: Record<string, string> = {
  monochrome: "#1C1C1A",
  earth: "#9A5B43",
  indigo: "#2E3A4F",
  jewel: "#5C5F45",
  soft: "#C8B99C",
  experimental: "#8B4545",
};

export default function Dna() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { setDna } = useDesign();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get("/dna/questions").then((d) => setQuestions(d.questions)).catch(() => {});
  }, []);

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [idx, questions.length, fade]);

  if (!questions.length) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.onSurface} />
      </View>
    );
  }

  const q = questions[idx];
  const progress = (idx + (answers[q.id] ? 1 : 0)) / questions.length;

  const choose = async (optId: string) => {
    Haptics.selectionAsync();
    const next = { ...answers, [q.id]: optId };
    setAnswers(next);
    setTimeout(async () => {
      if (idx < questions.length - 1) {
        setIdx(idx + 1);
      } else {
        setSubmitting(true);
        try {
          const result = await api.post("/dna/result", { answers: next });
          setDna(result);
          router.replace("/dna-result");
        } catch {
          setSubmitting(false);
        }
      }
    }, 260);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader
        onBack={() => (idx > 0 ? setIdx(idx - 1) : router.back())}
        title={`${idx + 1} / ${questions.length}`}
      />
      {/* hairline progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>

      <Animated.View style={[styles.content, { opacity: fade }]}>
        <View style={styles.titleWrap}>
          <Eyebrow text="Find your design DNA" />
          <Text style={styles.qTitle}>{q.title}</Text>
          {q.subtitle ? <Text style={styles.qSub}>{q.subtitle}</Text> : null}
        </View>

        {q.id === "india" ? (
          <View style={styles.stack}>
            {q.options.map((o) => {
              const on = answers[q.id] === o.id;
              return (
                <Pressable
                  key={o.id}
                  testID={`dna-option-${o.id}`}
                  onPress={() => choose(o.id)}
                  style={[styles.stackCard, on && styles.cardOn]}
                >
                  <Text style={[styles.stackLabel, on && styles.labelOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={styles.grid}>
            {q.options.map((o) => {
              const on = answers[q.id] === o.id;
              return (
                <Pressable
                  key={o.id}
                  testID={`dna-option-${o.id}`}
                  onPress={() => choose(o.id)}
                  style={[styles.tile, on && styles.cardOn]}
                >
                  {q.id === "palette" ? (
                    <View style={[styles.dot, { backgroundColor: PALETTE_DOTS[o.id] }]} />
                  ) : null}
                  <Text style={[styles.tileLabel, on && styles.labelOn]}>{o.label}</Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Animated.View>

      {submitting ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.onSurfaceInverse} />
          <Text style={styles.overlayText}>Reading your DNA…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  progressTrack: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.lg,
  },
  progressFill: { height: 1, backgroundColor: colors.onSurface },
  content: { flex: 1, paddingHorizontal: spacing.lg },
  titleWrap: { paddingTop: spacing.xxl, paddingBottom: spacing.xl, gap: spacing.sm },
  qTitle: { fontFamily: fonts.display, fontSize: 40, lineHeight: 44, color: colors.onSurface },
  qSub: { fontFamily: fonts.sans, fontSize: 14, color: colors.onSurfaceSecondary },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  tile: {
    width: "47.5%",
    aspectRatio: 1.35,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    borderRadius: radius.md,
  },
  dot: { width: 20, height: 20, borderRadius: 10 },
  tileLabel: { fontFamily: fonts.displayMedium, fontSize: 24, color: colors.onSurface },
  cardOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  labelOn: { color: colors.onSurfaceInverse },
  stack: { gap: spacing.md },
  stackCard: {
    height: 88,
    backgroundColor: colors.surfaceSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
  },
  stackLabel: { fontFamily: fonts.displayMedium, fontSize: 28, color: colors.onSurface },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(28,28,26,0.92)",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.md,
  },
  overlayText: { fontFamily: fonts.sans, fontSize: 14, color: colors.onSurfaceInverse, letterSpacing: 1 },
});
