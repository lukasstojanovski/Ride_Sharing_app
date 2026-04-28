import React from "react";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useI18n } from "@/lib/i18n";
import { Button, OrDivider, LangToggle } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import {
  colors,
  typography,
  spacing,
  radius,
  shadows,
} from "@/constants/theme";

export default function LoginScreen() {
  const { t, toggleLanguage, language } = useI18n();

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <AutoScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEnabled
        bounces
        alwaysBounceVertical
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>A</Text>
            </View>
            <Text style={styles.logoText}>AjdeGo</Text>
          </View>
          <LangToggle language={language} onToggle={toggleLanguage} />
        </View>

        {/* Hero card */}
        <View style={styles.heroCard}>
          <Text style={styles.heroEmoji}>🗺️</Text>
          <View style={styles.routeChip}>
            <View style={[styles.dot, { backgroundColor: colors.primary }]} />
            <Text style={styles.routeText}>Скопје</Text>
            <Text style={styles.routeArrow}>→</Text>
            <Text style={styles.routeText}>Охрид</Text>
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>350 ден.</Text>
            </View>
          </View>
        </View>

        {/* Tagline */}
        <Text style={styles.tagline}>{t.welcome.tagline}</Text>
        <Text style={styles.subtitle}>{t.welcome.subtitle}</Text>

        {/* CTA */}
        <View style={styles.actions}>
          <Button
            label={t.welcome.signUp}
            onPress={() => router.push("/auth/email-signup")}
            variant="primary"
          />

          <OrDivider label={t.or} />

          <Button
            label={t.welcome.signIn}
            onPress={() => router.push("/auth/email-signin")}
            variant="outline"
          />
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          {t.welcome.termsPrefix}
          <Text style={styles.termsLink}>{t.welcome.termsLink}</Text>
          {t.welcome.termsMiddle}
          <Text style={styles.termsLink}>{t.welcome.privacyLink}</Text>
        </Text>
      </AutoScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.base,
    marginBottom: spacing["2xl"],
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoMarkText: { fontSize: 18, fontWeight: "800", color: colors.textInverse },
  logoText: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
  },

  heroCard: {
    width: "100%",
    height: 180,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing["2xl"],
    overflow: "hidden",
  },
  heroEmoji: { fontSize: 72, opacity: 0.25, position: "absolute" },
  routeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    ...shadows.md,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  routeText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  routeArrow: { fontSize: typography.sizes.sm, color: colors.textMuted },
  priceBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.sm,
    marginLeft: spacing.xs,
  },
  priceText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },

  tagline: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    lineHeight: typography.sizes["2xl"] * 1.25,
    letterSpacing: -0.5,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: typography.sizes.base * 1.6,
    marginBottom: spacing["2xl"],
  },

  actions: { gap: spacing.md, marginBottom: spacing.xl },

  signinRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  signinPrompt: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  signinLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },

  terms: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: typography.sizes.xs * 1.7,
  },
  termsLink: { color: colors.primary, fontWeight: typography.weights.medium },
});
