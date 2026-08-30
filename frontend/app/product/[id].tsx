import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

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

export default function Product() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { setActiveJacket, setSelection } = useDesign();

  const [jacket, setJacket] = useState<Jacket | null>(null);
  const [loading, setLoading] = useState(true);
  const [gallery, setGallery] = useState(0);
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

  const images = [jacket.image, jacket.front_image, jacket.reverse_image, jacket.detail_image];
  const galleryH = width * 1.2;

  const makeItYours = () => {
    setActiveJacket(jacket);
    setSelection(seedSelection(jacket));
    router.push("/atelier");
  };

  const passport = [
    { k: "Silhouette", v: jacket.silhouette },
    { k: "Quilt pattern", v: jacket.quilt },
    { k: "Colour", v: jacket.colour },
    { k: "Craft intensity", v: jacket.craft_intensity },
    { k: "Material", v: jacket.material },
    { k: "Craft", v: jacket.craft },
    { k: "Production time", v: `${jacket.production_days} days` },
  ];

  return (
    <View style={styles.root}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Gallery */}
        <View style={{ height: galleryH }}>
          <FlatList
            data={images}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, i) => String(i)}
            onMomentumScrollEnd={(e) =>
              setGallery(Math.round(e.nativeEvent.contentOffset.x / width))
            }
            renderItem={({ item }) => (
              <Image
                source={{ uri: media(item) }}
                style={{ width, height: galleryH }}
                contentFit="cover"
                transition={300}
              />
            )}
          />
          <View style={[styles.galleryTop, { top: insets.top }]}>
            <BackHeader />
          </View>
          <View style={styles.dots}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, { backgroundColor: i === gallery ? colors.onSurface : colors.brandTertiary }]}
              />
            ))}
          </View>
        </View>

        {/* Title */}
        <View style={styles.body}>
          {jacket.hero ? <Eyebrow text={jacket.tagline ?? ""} /> : <Eyebrow text={jacket.category} />}
          <Text style={styles.title}>{jacket.name}</Text>
          <DualPrice
            inr={jacket.price_inr}
            usd={Math.round(jacket.price_inr * INR_TO_USD)}
            style={{ marginTop: spacing.sm }}
          />
          <Text style={styles.desc}>{jacket.description}</Text>

          {/* AI Design Moment */}
          <View style={styles.quoteBlock}>
            <Eyebrow text="The design moment" />
            <Text style={styles.quote}>
              “A {jacket.silhouette.toLowerCase()} silhouette in {jacket.colour.toLowerCase()}, where{" "}
              {jacket.quilt.toLowerCase()} quilting meets {jacket.craft_intensity.toLowerCase()} craft — old
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
