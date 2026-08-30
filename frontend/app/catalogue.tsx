import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";

import { api, media, Jacket, INR_TO_USD } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, DualPrice, Eyebrow } from "@/src/ui";

export default function Catalogue() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ craft?: string }>();
  const [genders, setGenders] = useState<string[]>(["All"]);
  const [craftsList, setCraftsList] = useState<string[]>(["All"]);
  const [gender, setGender] = useState("All");
  const [craft, setCraft] = useState(params.craft ?? "All");
  const [jackets, setJackets] = useState<Jacket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = () => {
    setLoading(true);
    setError(false);
    api
      .get(`/jackets?gender=${gender}&craft=${craft}`)
      .then((d) => {
        setGenders(d.genders);
        setCraftsList(d.crafts);
        setJackets(d.jackets);
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gender, craft]);

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Sticky header + filter rows */}
      <View style={styles.headerWrap}>
        <BackHeader title="The Collection" />
        <View style={styles.introRow}>
          <Eyebrow text="One brand. Many crafts." />
          <Text style={styles.count}>{jackets.length} pieces</Text>
        </View>

        <Text style={styles.filterLabel}>SHOP</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContent}
        >
          {genders.map((g) => {
            const on = g === gender;
            return (
              <Pressable
                key={g}
                testID={`gender-chip-${g.toLowerCase()}`}
                onPress={() => setGender(g)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
              >
                <Text style={[styles.chipText, { color: on ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>
                  {g}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <Text style={styles.filterLabel}>CRAFT</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipRow}
          contentContainerStyle={styles.chipContent}
        >
          {craftsList.map((c) => {
            const on = c === craft;
            return (
              <Pressable
                key={c}
                testID={`craft-chip-${c.toLowerCase()}`}
                onPress={() => setCraft(c)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}
              >
                <Text style={[styles.chipText, { color: on ? colors.onSurfaceInverse : colors.onSurfaceSecondary }]}>
                  {c}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.onSurface} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>Unable to load the collection.</Text>
          <Pressable testID="retry-button" onPress={() => load()}>
            <Text style={styles.retry}>RETRY</Text>
          </Pressable>
        </View>
      ) : !jackets.length ? (
        <View style={styles.center}>
          <Text style={styles.errorText}>No pieces match these filters yet.</Text>
          <Pressable testID="clear-filters-button" onPress={() => { setGender("All"); setCraft("All"); }}>
            <Text style={styles.retry}>CLEAR FILTERS</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={jackets}
          keyExtractor={(j) => j.id}
          numColumns={2}
          columnWrapperStyle={{ gap: spacing.md }}
          contentContainerStyle={{
            paddingHorizontal: spacing.lg,
            paddingTop: spacing.md,
            paddingBottom: insets.bottom + spacing.xxl,
            gap: spacing.xl,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <Pressable
              testID={`jacket-card-${item.id}`}
              onPress={() => router.push(`/product/${item.id}`)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
            >
              <Image
                source={{ uri: media(item.image) }}
                style={styles.cardImg}
                contentFit="cover"
                transition={300}
              />
              {item.hero ? (
                <View style={styles.heroTag}>
                  <Text style={styles.heroTagText}>HERO</Text>
                </View>
              ) : null}
              <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.cardMeta} numberOfLines={1}>
                {item.gender} · {item.craft_type}
              </Text>
              <DualPrice
                inr={item.price_inr}
                usd={Math.round(item.price_inr * INR_TO_USD)}
                style={{ fontSize: 13, marginTop: 2 }}
              />
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  headerWrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
    paddingBottom: spacing.sm,
  },
  introRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  count: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.onSurfaceTertiary,
    letterSpacing: 1,
  },
  filterLabel: {
    fontFamily: fonts.sansMedium,
    fontSize: 10,
    letterSpacing: 2,
    color: colors.onSurfaceTertiary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  chipRow: { height: 50 },
  chipContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    alignItems: "center",
  },
  chip: {
    height: 34,
    flexShrink: 0,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipOff: { backgroundColor: "transparent", borderColor: colors.border },
  chipText: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 1,
  },
  card: { flex: 1 },
  cardImg: {
    width: "100%",
    aspectRatio: 0.8,
    backgroundColor: colors.surfaceSecondary,
    marginBottom: spacing.sm,
  },
  heroTag: {
    position: "absolute",
    top: spacing.sm,
    left: spacing.sm,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  heroTagText: {
    fontFamily: fonts.sansMedium,
    fontSize: 9,
    letterSpacing: 1.5,
    color: colors.onSurface,
  },
  cardName: {
    fontFamily: fonts.sansMedium,
    fontSize: 14,
    color: colors.onSurface,
  },
  cardMeta: {
    fontFamily: fonts.sans,
    fontSize: 12,
    color: colors.onSurfaceTertiary,
    marginTop: 2,
    marginBottom: 4,
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.md },
  errorText: { fontFamily: fonts.sans, color: colors.onSurfaceSecondary, fontSize: 14 },
  retry: { fontFamily: fonts.sansMedium, color: colors.onSurface, fontSize: 12, letterSpacing: 2 },
});
