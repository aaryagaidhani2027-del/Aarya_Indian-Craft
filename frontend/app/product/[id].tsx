import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Animated,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { api, media, Jacket, Selection, INR_TO_USD } from "@/src/api";
import { colors, fonts, spacing } from "@/src/theme";
import { BackHeader, DualPrice, Eyebrow, PrimaryButton } from "@/src/ui";
import { useDesign } from "@/src/store";

function seedSelection(j: Jacket): Selection {
  return {
    silhouette: j.silhouette.toLowerCase(),
    quilt: j.quilt.toLowerCase(),
    colour: j.colour.toLowerCase(),
    craft: j.craft_intensity.toLowerCase(),
    personal: "none",
    personal_value: null,
  };
}

function FlippableJacket({
  front,
  reverse,
  w,
  h,
  label,
}: {
  front: string;
  reverse: string;
  w: number;
  h: number;
  label: string;
}) {
  const [flipped, setFlipped] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const flip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const to = flipped ? 0 : 1;
    Animated.spring(anim, { toValue: to, useNativeDriver: true, friction: 9, tension: 12 }).start();
    setFlipped(!flipped);
  };

  const frontRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "180deg"] });
  const backRotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["180deg", "360deg"] });

  return (
    <View style={{ width: w, height: h, backgroundColor: colors.surfaceSecondary }}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backfaceVisibility: "hidden", transform: [{ perspective: 1200 }, { rotateY: frontRotate }] },
        ]}
      >
        <Image source={{ uri: media(front) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
      </Animated.View>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { backfaceVisibility: "hidden", transform: [{ perspective: 1200 }, { rotateY: backRotate }] },
        ]}
      >
        <Image source={{ uri: media(reverse) }} style={{ width: "100%", height: "100%" }} contentFit="cover" transition={200} />
      </Animated.View>

      <View style={flipStyles.sideLabel} pointerEvents="none">
        <Text style={flipStyles.sideLabelText}>{flipped ? "REVERSE" : "FRONT"}</Text>
      </View>

      <Pressable
        testID="flip-jacket-button"
        onPress={flip}
        style={({ pressed }) => [flipStyles.flipBtn, pressed && { opacity: 0.85 }]}
      >
        <Feather name="refresh-cw" size={14} color={colors.onSurfaceInverse} />
        <Text style={flipStyles.flipText}>{label}</Text>
      </Pressable>
    </View>
  );
}

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { setActiveJacket, setSelection } = useDesign();

  const [jacket, setJacket] = useState<Jacket | null>(null);
  const [loading, setLoading] = useState(true);
  const [openPassport, setOpenPassport] = useState(true);

  useEffect(() => {
    api.get(`/jackets/${id}`).then(setJacket).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  if (loading || !jacket) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <ActivityIndicator color={colors.onSurface} />
      </View>
    );
  }

  const galleryH = width * 1.2;

  const makeItYours = () => {
    setActiveJacket(jacket);
    setSelection(seedSelection(jacket));
    router.push("/atelier");
  };

  const passport = [
    { k: "Craft", v: jacket.craft },
    { k: "Technique", v: jacket.technique ?? "Hand-finished" },
    { k: "Material", v: jacket.material },
    { k: "Origin", v: "India" },
    { k: "Maker", v: "40+ artisan collective" },
    { k: "Production time", v: `${jacket.production_days} days` },
  ];
  const pieceId = `PIECE ${jacket.piece_no ?? "000"} / ${jacket.craft_type.toUpperCase()} / 2026`;

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Flippable hero — one jacket, two worlds */}
        <View style={{ height: galleryH }}>
          <FlippableJacket
            front={jacket.front_image}
            reverse={jacket.reverse_image}
            w={width}
            h={galleryH}
            label={jacket.reversible ? "ONE JACKET · TWO WORLDS" : "TURN TO SEE THE CRAFT"}
          />
          <View style={[styles.galleryTop, { top: insets.top }]}>
            <BackHeader />
          </View>
        </View>

        {/* Title */}
        <View style={styles.body}>
          {jacket.hero ? <Eyebrow text={jacket.tagline ?? ""} /> : <Eyebrow text={`${jacket.gender} · ${jacket.craft_type}`} />}
          <Text style={styles.title}>{jacket.name}</Text>
          <DualPrice
            inr={jacket.price_inr}
            usd={Math.round(jacket.price_inr * INR_TO_USD)}
            style={{ marginTop: spacing.sm }}
          />
          <View style={styles.pieceBadge}>
            <Text style={styles.pieceText}>{pieceId}</Text>
          </View>
          <Text style={styles.desc}>{jacket.description}</Text>

          {/* AI Design Moment */}
          <View style={styles.quoteBlock}>
            <Eyebrow text="The design moment" />
            <Text style={styles.quote}>
              “A {jacket.silhouette.toLowerCase()} silhouette in {jacket.colour.toLowerCase()}, where{" "}
              {jacket.craft.toLowerCase()} meets {jacket.craft_intensity.toLowerCase()} craft — old
              craft, spoken in a new language.”
            </Text>
          </View>

          {/* Passport accordion */}
          <Pressable
            testID="passport-toggle"
            onPress={() => setOpenPassport((v) => !v)}
            style={styles.accHeader}
          >
            <Text style={styles.accTitle}>PRODUCT PASSPORT</Text>
            <Feather name={openPassport ? "minus" : "plus"} size={18} color={colors.onSurface} />
          </Pressable>
          {openPassport ? (
            <View style={styles.specList}>
              {passport.map((p) => (
                <View key={p.k} style={styles.specRow}>
                  <Text style={styles.specKey}>{p.k}</Text>
                  <Text style={styles.specVal}>{p.v}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <Pressable
            testID="craft-story-link"
            onPress={() => router.push("/craft-story")}
            style={styles.craftLink}
          >
            <Feather name="headphones" size={16} color={colors.onSurface} />
            <Text style={styles.craftLinkText}>MEET YOUR CRAFT</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton testID="make-it-yours-cta" label="MAKE IT YOURS" onPress={makeItYours} />
      </View>
    </View>
  );
}

const flipStyles = StyleSheet.create({
  sideLabel: {
    position: "absolute",
    top: 60,
    right: spacing.lg,
    backgroundColor: "rgba(28,28,26,0.85)",
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  sideLabelText: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.onSurfaceInverse,
  },
  flipBtn: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    backgroundColor: colors.brand,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: 999,
  },
  flipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 1.5,
    color: colors.onSurfaceInverse,
  },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  center: { alignItems: "center", justifyContent: "center" },
  galleryTop: { position: "absolute", left: 0, right: 0 },
  dots: {
    position: "absolute",
    bottom: spacing.lg,
    alignSelf: "center",
    flexDirection: "row",
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  body: { paddingHorizontal: spacing.lg, paddingTop: spacing.xl },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 42,
    color: colors.onSurface,
    marginTop: spacing.xs,
  },
  pieceBadge: {
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: spacing.md,
  },
  pieceText: { fontFamily: fonts.sansMedium, fontSize: 10, letterSpacing: 2, color: colors.onSurfaceTertiary },
  desc: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.lg,
  },
  quoteBlock: {
    marginTop: spacing.xl,
    paddingLeft: spacing.lg,
    borderLeftWidth: 1,
    borderLeftColor: colors.borderStrong,
    gap: spacing.sm,
  },
  quote: {
    fontFamily: fonts.displayMedium,
    fontSize: 24,
    lineHeight: 32,
    color: colors.onSurface,
  },
  accHeader: {
    marginTop: spacing.xxl,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  accTitle: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2, color: colors.onSurface },
  specList: { paddingBottom: spacing.md },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  specKey: { fontFamily: fonts.sans, fontSize: 13, color: colors.onSurfaceTertiary },
  specVal: { fontFamily: fonts.sansMedium, fontSize: 13, color: colors.onSurface, maxWidth: "60%", textAlign: "right" },
  craftLink: {
    marginTop: spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  craftLinkText: { fontFamily: fonts.sansMedium, fontSize: 12, letterSpacing: 2, color: colors.onSurface },
  stickyBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
  },
});
