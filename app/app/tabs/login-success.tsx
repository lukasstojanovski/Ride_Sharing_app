import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { typography, spacing } from "@/constants/theme";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";

export default function LoginSuccessScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>✅</Text>
      <Text style={styles.title}>Successfully logged in!</Text>
      <Text style={styles.subtitle}>Welcome back.</Text>
    </View>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
      backgroundColor: colors.background,
      gap: spacing.md,
    },
    emoji: { fontSize: 64 },
    title: {
      fontSize: typography.sizes["2xl"],
      fontWeight: typography.weights.extrabold,
      color: colors.text,
      textAlign: "center",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: typography.sizes.base,
      color: colors.textSecondary,
      textAlign: "center",
    },
  });
}
