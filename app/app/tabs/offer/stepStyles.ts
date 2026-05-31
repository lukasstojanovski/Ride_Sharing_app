import { useMemo } from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius, shadows } from "@/constants/theme";

export function useOfferStepStyles() {
  const { colors } = useTheme();
  return useMemo(() => createStepStyles(colors), [colors]);
}

function createStepStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: spacing.xl,
      paddingBottom: spacing["3xl"],
    },
    title: {
      fontSize: typography.sizes["2xl"],
      fontWeight: typography.weights.extrabold,
      color: colors.text,
      marginBottom: spacing.sm,
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: typography.sizes.base,
      color: colors.textSecondary,
      marginBottom: spacing.xl,
      lineHeight: 22,
    },
    formCard: {
      backgroundColor: colors.background,
      borderRadius: radius.xl,
      padding: spacing.xl,
      marginBottom: spacing.xl,
      borderWidth: 1.5,
      borderColor: colors.primary,
      gap: spacing.base,
      ...shadows.md,
    },
    errorText: {
      color: colors.error,
      fontSize: typography.sizes.sm,
      marginTop: spacing.xs,
    },
    btn: { marginTop: spacing.sm },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.xl,
    },
    successText: {
      fontSize: typography.sizes.xl,
      fontWeight: typography.weights.bold,
      color: colors.success,
      marginBottom: spacing.sm,
    },
    successSub: { fontSize: typography.sizes.base, color: colors.textSecondary },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    switchLabel: {
      fontSize: typography.sizes.base,
      color: colors.text,
      fontWeight: typography.weights.medium,
      flex: 1,
      paddingRight: spacing.md,
    },
  });
}

export function useOfferMapStyles() {
  const { colors } = useTheme();
  return useMemo(
    () =>
      StyleSheet.create({
        mapWrap: {
          height: 320,
          borderRadius: radius.xl,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
        },
        mapLoading: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        },
        mapLoadingText: {
          color: colors.textMuted,
          fontSize: typography.sizes.sm,
          textAlign: "center",
          marginBottom: spacing.sm,
        },
        pointLabel: {
          marginTop: spacing.sm,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
        },
        pointValue: {
          color: colors.text,
          fontSize: typography.sizes.base,
        },
        pickupLabel: {
          marginTop: spacing.sm,
          color: colors.textSecondary,
          fontSize: typography.sizes.sm,
          fontWeight: typography.weights.semibold,
        },
        pickupValue: {
          color: colors.text,
          fontSize: typography.sizes.base,
        },
      }),
    [colors]
  );
}
