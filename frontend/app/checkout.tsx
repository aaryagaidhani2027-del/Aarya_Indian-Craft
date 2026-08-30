import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";

import { api, media, INR_TO_USD } from "@/src/api";
import { colors, fonts, spacing, radius } from "@/src/theme";
import { BackHeader, DualPrice, Eyebrow, PrimaryButton } from "@/src/ui";
import { useDesign } from "@/src/store";

const SIZES = ["XS", "S", "M", "L", "XL"];

export default function Checkout() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { selection, compute, activeJacket, size, setSize } = useDesign();

  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState<{ order_id: string; delivery_estimate_days: number } | null>(null);

  const jacketName = activeJacket?.name ?? "The Reversible Quilted Jacket";
  const image = activeJacket?.image ?? "hero_male";
  const priceInr = compute?.price.total_inr ?? activeJacket?.price_inr ?? 8500;
  const priceUsd = compute?.price.total_usd ?? Math.round((activeJacket?.price_inr ?? 8500) * INR_TO_USD);
  const productionDays = activeJacket?.production_days ?? 21;
  const lines = compute?.price.lines ?? [{ label: "Base jacket", amount: priceInr }];

  const customisation = [
    { k: "Silhouette", v: selection.silhouette },
    { k: "Quilt", v: selection.quilt },
    { k: "Colour", v: selection.colour },
    { k: "Craft", v: selection.craft },
    ...(selection.personal !== "none"
      ? [{ k: "Personal", v: `${selection.personal}${selection.personal_value ? ` · ${selection.personal_value}` : ""}` }]
      : []),
  ];

  const buy = async () => {
    setPlacing(true);
    try {
      const res = await api.post("/checkout", {
        jacket_name: jacketName,
        selection,
        size,
        price_inr: priceInr,
        price_usd: priceUsd,
        production_days: productionDays,
      });
      setOrder(res);
    } catch {
      setPlacing(false);
    }
  };

  if (order) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <View style={styles.confirmWrap} testID="order-confirmation">
          <View style={styles.tick}>
            <Feather name="check" size={28} color={colors.onSurfaceInverse} />
          </View>
          <Eyebrow text={`Order ${order.order_id}`} />
          <Text style={styles.confirmTitle}>Your jacket is{"\n"}in the making.</Text>
          <Text style={styles.confirmBody}>
            Our artisans have received your design. You&apos;ll receive it in roughly{" "}
            {order.delivery_estimate_days} days — each stitch made by hand.
          </Text>
          <PrimaryButton
            testID="back-home-button"
            label="BACK TO THE BRAND"
            onPress={() => router.replace("/")}
            style={{ marginTop: spacing.xxl, alignSelf: "stretch" }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <BackHeader title="Checkout" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Product */}
        <View style={styles.product}>
          <Image source={{ uri: media(image) }} style={styles.productImg} contentFit="cover" transition={300} />
          <View style={styles.productInfo}>
            <Eyebrow text="Your piece" />
            <Text style={styles.productName}>{jacketName}</Text>
            <DualPrice inr={priceInr} usd={priceUsd} style={{ fontSize: 14, marginTop: spacing.xs }} />
          </View>
        </View>

        {/* Customisation */}
        <Section title="Customisation">
          <View style={styles.chipWrap}>
            {customisation.map((c) => (
              <View key={c.k} style={styles.summaryChip}>
                <Text style={styles.chipKey}>{c.k}</Text>
                <Text style={styles.chipVal}>{c.v}</Text>
              </View>
            ))}
          </View>
        </Section>

        {/* Size */}
        <Section title="Size">
          <View style={styles.sizeRow}>
            {SIZES.map((s) => {
              const on = s === size;
              return (
                <Pressable
                  key={s}
                  testID={`size-${s}`}
                  onPress={() => setSize(s)}
                  style={[styles.sizeChip, on && styles.sizeOn]}
                >
                  <Text style={[styles.sizeText, on && { color: colors.onSurfaceInverse }]}>{s}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        {/* Price breakdown */}
        <Section title="Price breakdown">
          {lines.map((l, i) => (
            <View key={i} style={styles.priceRow}>
              <Text style={styles.priceLabel}>{l.label}</Text>
              <Text style={styles.priceAmt}>₹ {l.amount.toLocaleString("en-IN")}</Text>
            </View>
          ))}
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total</Text>
            <DualPrice inr={priceInr} usd={priceUsd} style={{ fontSize: 15 }} />
          </View>
        </Section>

        {/* Production + delivery */}
        <Section title="Production & delivery">
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Production time</Text>
            <Text style={styles.priceAmt}>{productionDays} days</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Estimated delivery</Text>
            <Text style={styles.priceAmt}>{productionDays + 5} days</Text>
          </View>
        </Section>
      </ScrollView>

      <View style={[styles.stickyBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          testID="buy-jacket-button"
          label={placing ? "PLACING ORDER…" : "BUY MY JACKET"}
          onPress={buy}
          loading={placing}
        />
      </View>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface },
  product: {
    flexDirection: "row",
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  productImg: { width: 110, aspectRatio: 0.8, backgroundColor: colors.surfaceSecondary },
  productInfo: { flex: 1, justifyContent: "center", gap: spacing.xs },
  productName: { fontFamily: fonts.display, fontSize: 26, lineHeight: 28, color: colors.onSurface },
  section: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontFamily: fonts.sansMedium,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
    color: colors.onSurfaceTertiary,
    marginBottom: spacing.md,
  },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  summaryChip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipKey: { fontFamily: fonts.sans, fontSize: 10, letterSpacing: 1, color: colors.onSurfaceTertiary, textTransform: "uppercase" },
  chipVal: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.onSurface, textTransform: "capitalize" },
  sizeRow: { flexDirection: "row", gap: spacing.sm },
  sizeChip: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: radius.md,
  },
  sizeOn: { backgroundColor: colors.brand, borderColor: colors.brand },
  sizeText: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.onSurface },
  priceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: spacing.sm },
  priceLabel: { fontFamily: fonts.sans, fontSize: 14, color: colors.onSurfaceSecondary },
  priceAmt: { fontFamily: fonts.sansMedium, fontSize: 14, color: colors.onSurface },
  totalRow: { borderTopWidth: 1, borderTopColor: colors.divider, marginTop: spacing.sm, paddingTop: spacing.md },
  totalLabel: { fontFamily: fonts.sansMedium, fontSize: 15, color: colors.onSurface },
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
  confirmWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: spacing.xl, gap: spacing.md },
  tick: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center", marginBottom: spacing.md },
  confirmTitle: { fontFamily: fonts.display, fontSize: 42, lineHeight: 44, color: colors.onSurface, textAlign: "center" },
  confirmBody: { fontFamily: fonts.sans, fontSize: 15, lineHeight: 24, color: colors.onSurfaceSecondary, textAlign: "center", maxWidth: 340 },
});
