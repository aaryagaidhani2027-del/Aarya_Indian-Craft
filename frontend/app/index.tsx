import React, { useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Animated,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { media } from "@/src/api";
import { colors, fonts, spacing } from "@/src/theme";
import { PrimaryButton, SecondaryButton, Eyebrow } from "@/src/ui";

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;

  const heroH = height * 0.82;

  const heroTranslate = scrollY.interpolate({
    inputRange: [-200, 0, heroH],
    outputRange: [-60, 0, heroH * 0.4],
    extrapolate: "clamp",
  });
  const heroScale = scrollY.interpolate({
    inputRange: [-200, 0],
    outputRange: [1.25, 1],
    extrapolate: "clamp",
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, heroH * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.root}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
      >
        {/* HERO */}
        <View style={{ height: heroH, width, overflow: "hidden" }}>
          <Animated.View
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              transform: [{ translateY: heroTranslate }, { scale: heroScale }],
            }}
          >
            <Image
              testID="hero-image"
              source={{ uri: media("hero_male") }}
              style={{ width: "100%", height: "100%" }}
              contentFit="cover"
              transition={600}
            />
            <LinearGradient
              colors={["rgba(28,28,26,0.35)", "rgba(28,28,26,0)", "rgba(28,28,26,0.85)"]}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroContent,
              { paddingTop: insets.top + spacing.xl, opacity: titleOpacity },
            ]}
          >
            <Eyebrow text="Contemporary Indian Craft" color="rgba(251,251,249,0.75)" />
          </Animated.View>

          <Animated.View style={[styles.heroBottom, { opacity: titleOpacity }]}>
            <Text style={styles.heroTitle} testID="hero-title">
              OLD CRAFT.{"\n"}NEW LANGUAGE.
            </Text>
            <Text style={styles.heroCopy}>
              Discover Indian craft through a contemporary lens — and create
              something that feels entirely yours.
            </Text>
          </Animated.View>
        </View>

        {/* CTAs */}
        <View style={styles.ctaBlock}>
          <PrimaryButton
            testID="discover-dna-cta"
            label="DISCOVER YOUR DESIGN DNA"
            onPress={() => router.push("/dna")}
          />
          <SecondaryButton
            testID="explore-jacket-cta"
            label="EXPLORE THE JACKET"
            onPress={() => router.push("/product/j01")}
            style={{ marginTop: spacing.md }}
          />
        </View>

        {/* REVERSIBLE STORY */}
        <View style={styles.section}>
          <Eyebrow text="The hero piece" />
          <Text style={styles.sectionTitle}>One jacket.{"\n"}Two worlds.</Text>
          <Text style={styles.sectionBody}>
            The Reversible Quilted Jacket carries two moods in a single, wearable
            silhouette — turn it inside out and it becomes another version of you.
          </Text>
          <View style={styles.pairRow}>
            <View style={styles.pairItem}>
              <Image source={{ uri: media("jacket_front") }} style={styles.pairImg} contentFit="cover" transition={400} />
              <Text style={styles.pairLabel}>FRONT</Text>
            </View>
            <View style={styles.pairItem}>
              <Image source={{ uri: media("jacket_reverse") }} style={styles.pairImg} contentFit="cover" transition={400} />
              <Text style={styles.pairLabel}>REVERSE</Text>
            </View>
          </View>
        </View>

        {/* CRAFT TEASER */}
        <Pressable
          testID="craft-story-teaser"
          onPress={() => router.push("/craft-story")}
          style={({ pressed }) => [pressed && { opacity: 0.9 }]}
        >
          <View style={{ height: 420 }}>
            <Image source={{ uri: media("quilt_closeup") }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
            <LinearGradient
              colors={["rgba(28,28,26,0)", "rgba(28,28,26,0.8)"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.teaserContent}>
              <Eyebrow text="Know what you're wearing" color="rgba(251,251,249,0.75)" />
              <Text style={styles.teaserTitle}>The quiet revolution of{"\n"}Indian quilting</Text>
              <View style={styles.teaserLink}>
                <Text style={styles.teaserLinkText}>LISTEN TO THE STORY</Text>
                <Feather name="arrow-right" size={16} color={colors.onSurfaceInverse} />
              </View>
            </View>
          </View>
        </Pressable>

        {/* EXPLORE COLLECTION */}
        <View style={[styles.section, { paddingBottom: insets.bottom + spacing.xxxl }]}>
          <Eyebrow text="The collection" />
          <Text style={styles.sectionTitle}>Twelve concepts.{"\n"}One language.</Text>
          <Text style={styles.sectionBody}>
            A tightly curated catalogue — from the quietest minimal cut to the
            loudest experimental voice.
          </Text>
          <PrimaryButton
            testID="explore-collection-cta"
            label="EXPLORE THE COLLECTION"
            onPress={() => router.push("/catalogue")}
            style={{ marginTop: spacing.xl }}
          />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  heroContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  heroBottom: {
    position: "absolute",
    bottom: spacing.xxl,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
  },
  heroTitle: {
    fontFamily: fonts.display,
    color: colors.onSurfaceInverse,
    fontSize: 52,
    lineHeight: 52,
    letterSpacing: 0.5,
  },
  heroCopy: {
    fontFamily: fonts.sans,
    color: "rgba(251,251,249,0.85)",
    fontSize: 15,
    lineHeight: 23,
    marginTop: spacing.lg,
    maxWidth: 320,
  },
  ctaBlock: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    backgroundColor: colors.surface,
  },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
  },
  sectionTitle: {
    fontFamily: fonts.display,
    fontSize: 40,
    lineHeight: 42,
    color: colors.onSurface,
    marginTop: spacing.sm,
  },
  sectionBody: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 24,
    color: colors.onSurfaceSecondary,
    marginTop: spacing.md,
    maxWidth: 360,
  },
  pairRow: {
    flexDirection: "row",
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  pairItem: { flex: 1 },
  pairImg: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: colors.surfaceSecondary,
  },
  pairLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: colors.onSurfaceTertiary,
    marginTop: spacing.sm,
  },
  teaserContent: {
    position: "absolute",
    bottom: spacing.xl,
    left: spacing.lg,
    right: spacing.lg,
  },
  teaserTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    lineHeight: 36,
    color: colors.onSurfaceInverse,
    marginTop: spacing.sm,
  },
  teaserLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.lg,
  },
  teaserLinkText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    color: colors.onSurfaceInverse,
  },
});
