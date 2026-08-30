import React, { useEffect, useRef, useState } from "react";
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

import { api, media } from "@/src/api";
import { colors, fonts, spacing } from "@/src/theme";
import { PrimaryButton, SecondaryButton, Eyebrow } from "@/src/ui";

// The fashion-film sequence: man -> woman -> craft macro -> product -> movement.
const HERO_SEQUENCE = ["hero_male", "hero_female", "quilt_closeup", "jacket_front", "cropped_quilt_women"];

type Craft = { id: string; title: string; image: string; description: string };

export default function Landing() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  const ken = useRef(new Animated.Value(0)).current;
  const cross = useRef(new Animated.Value(0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  const [baseImg, setBaseImg] = useState(HERO_SEQUENCE[0]);
  const [overlayImg, setOverlayImg] = useState<string | null>(null);
  const [crafts, setCrafts] = useState<Craft[]>([]);
  const seqRef = useRef(0);

  const heroH = height * 0.82;

  const heroTranslate = scrollY.interpolate({
    inputRange: [-200, 0, heroH],
    outputRange: [-60, 0, heroH * 0.4],
    extrapolate: "clamp",
  });
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, heroH * 0.5],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  // Ken Burns slow zoom (loops), gentle crossfade between two hero images,
  // and a one-shot headline entrance. All restrained — no gradients/flash.
  const kenScale = ken.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
  const enterTranslate = enter.interpolate({ inputRange: [0, 1], outputRange: [26, 0] });
  const titleEnterOpacity = Animated.multiply(titleOpacity, enter);

  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 1100,
      delay: 250,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(ken, { toValue: 1, duration: 14000, useNativeDriver: true }),
        Animated.timing(ken, { toValue: 0, duration: 14000, useNativeDriver: true }),
      ])
    ).start();
  }, [ken, enter]);

  useEffect(() => {
    api.get("/crafts").then((d) => setCrafts(d.crafts)).catch(() => {});
  }, []);

  // Cinematic sequence: crossfade through the campaign frames like a fashion film.
  useEffect(() => {
    const id = setInterval(() => {
      const ni = (seqRef.current + 1) % HERO_SEQUENCE.length;
      setOverlayImg(HERO_SEQUENCE[ni]);
      cross.setValue(0);
      Animated.timing(cross, { toValue: 1, duration: 1700, useNativeDriver: true }).start(({ finished }) => {
        if (finished) {
          seqRef.current = ni;
          setBaseImg(HERO_SEQUENCE[ni]);
          setOverlayImg(null);
          cross.setValue(0);
        }
      });
    }, 4200);
    return () => clearInterval(id);
  }, [cross]);

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
              transform: [{ translateY: heroTranslate }],
            }}
          >
            <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale: kenScale }] }]}>
              <Image
                testID="hero-image"
                source={{ uri: media(baseImg) }}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                transition={0}
              />
              {overlayImg ? (
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: cross }]}>
                  <Image
                    source={{ uri: media(overlayImg) }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    transition={0}
                  />
                </Animated.View>
              ) : null}
            </Animated.View>
            <LinearGradient
              colors={["rgba(28,28,26,0.35)", "rgba(28,28,26,0)", "rgba(28,28,26,0.85)"]}
              locations={[0, 0.4, 1]}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroContent,
              { paddingTop: insets.top + spacing.xl, opacity: titleEnterOpacity },
            ]}
          >
            <Eyebrow text="Contemporary Indian Craft" color="rgba(251,251,249,0.75)" />
          </Animated.View>

          <Animated.View
            style={[
              styles.heroBottom,
              { opacity: titleEnterOpacity, transform: [{ translateY: enterTranslate }] },
            ]}
          >
            <Text style={styles.heroTitle} testID="hero-title">
              OLD CRAFT.{"\n"}NEW LANGUAGE.
            </Text>
            <Text style={styles.heroSub}>Indian craft, translated for how we live now.</Text>
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
            testID="explore-collection-cta"
            label="EXPLORE THE COLLECTION"
            onPress={() => router.push("/catalogue")}
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

        {/* CRAFT, REIMAGINED */}
        <View style={styles.section}>
          <Eyebrow text="Craft, reimagined" />
          <Text style={styles.sectionTitle}>Thousands of traditions.{"\n"}A new vocabulary.</Text>
        </View>
        <View style={styles.craftList}>
          {crafts.map((c, i) => (
            <Pressable
              key={c.id}
              testID={`craft-card-${c.id.toLowerCase()}`}
              onPress={() => router.push(`/catalogue?craft=${c.id}`)}
              style={({ pressed }) => [styles.craftCard, pressed && { opacity: 0.92 }]}
            >
              <Image source={{ uri: media(c.image) }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} />
              <LinearGradient
                colors={["rgba(28,28,26,0.15)", "rgba(28,28,26,0.75)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.craftCardText}>
                <Text style={styles.craftIndex}>{`0${i + 1}`}</Text>
                <Text style={styles.craftTitle}>{c.title}</Text>
                <Text style={styles.craftDesc}>{c.description}</Text>
              </View>
            </Pressable>
          ))}
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
          <Text style={styles.sectionTitle}>Nine pieces.{"\n"}Three craft languages.</Text>
          <Text style={styles.sectionBody}>
            A tightly curated collection for men and women — one brand, many crafts,
            wearable from Mumbai to Tokyo.
          </Text>
          <PrimaryButton
            testID="view-all-cta"
            label="VIEW THE COLLECTION"
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
  heroSub: {
    fontFamily: fonts.sans,
    color: "rgba(251,251,249,0.7)",
    fontSize: 13,
    letterSpacing: 0.3,
    marginTop: spacing.md,
  },
  craftList: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.md,
  },
  craftCard: {
    height: 200,
    overflow: "hidden",
    justifyContent: "flex-end",
    backgroundColor: colors.surfaceSecondary,
  },
  craftCardText: { padding: spacing.lg, gap: 4 },
  craftIndex: {
    fontFamily: fonts.sansMedium,
    fontSize: 11,
    letterSpacing: 2,
    color: "rgba(251,251,249,0.7)",
  },
  craftTitle: {
    fontFamily: fonts.display,
    fontSize: 34,
    letterSpacing: 1,
    color: colors.onSurfaceInverse,
  },
  craftDesc: {
    fontFamily: fonts.sans,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(251,251,249,0.85)",
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
