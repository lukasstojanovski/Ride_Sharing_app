import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";

interface AppHeaderProps {
  rightElement?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  title?: string;
}

export function AppHeader({ rightElement, showBack, onBack, title }: AppHeaderProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.header}>
      <View style={styles.left}>
        {showBack && onBack ? (
          <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.logoRow}>
            <View style={styles.logoMark}>
              <Text style={styles.logoMarkText}>A</Text>
            </View>
            <Text style={styles.logoText}>AjdeGo</Text>
          </View>
        )}
        {title && showBack ? (
          <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
        ) : null}
      </View>
      {rightElement && <View style={styles.right}>{rightElement}</View>}
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: spacing.base,
      paddingBottom: spacing.xl,
    },
    left: { flexDirection: "row", alignItems: "center" },
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
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: -spacing.sm,
    },
    backArrow: { fontSize: 20, color: colors.text },
    headerTitle: {
      fontSize: typography.sizes.lg,
      fontWeight: typography.weights.bold,
      color: colors.text,
      marginLeft: spacing.md,
      flex: 1,
    },
    right: {},
  });
}
