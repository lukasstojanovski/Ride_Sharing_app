import { useMemo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPicker } from "@/components/SettingsPicker";
import { useI18n } from "@/lib/i18n";
import { useTheme, ThemeMode } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing } from "@/constants/theme";

export default function ProfileSettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { colors, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentLangLabel = language === "en" ? "English" : "Македонски";

  const themeValueLabel = useMemo(() => {
    if (themeMode === "light") return t.settings.themeLight;
    if (themeMode === "dark") return t.settings.themeDark;
    return t.settings.themeSystem;
  }, [themeMode, t.settings.themeLight, t.settings.themeDark, t.settings.themeSystem]);

  const themeOptions = useMemo(
    () => [
      { id: "light" as ThemeMode, label: t.settings.themeLight },
      { id: "dark" as ThemeMode, label: t.settings.themeDark },
      { id: "system" as ThemeMode, label: t.settings.themeSystem },
    ],
    [t.settings.themeLight, t.settings.themeDark, t.settings.themeSystem]
  );

  const languageOptions = useMemo(
    () => [
      { id: "en", label: "English" },
      { id: "mk", label: "Македонски" },
    ],
    []
  );

  return (
    <SafeAreaView style={styles.safe}>
      <AutoScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader showBack onBack={() => router.back()} />

        <Text style={styles.title}>{t.settings.title}</Text>

        <View style={styles.formCard}>
          <SettingsPicker
            label={t.settings.language}
            valueLabel={currentLangLabel}
            options={languageOptions}
            selectedId={language}
            onSelect={(id) => setLanguage(id as "en" | "mk")}
          />

          <SettingsPicker
            label={t.settings.appearance}
            valueLabel={themeValueLabel}
            options={themeOptions}
            selectedId={themeMode}
            onSelect={(id) => setThemeMode(id as ThemeMode)}
          />
        </View>
      </AutoScrollView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: colors.background },
    container: { flex: 1 },
    content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
    title: {
      fontSize: typography.sizes["2xl"],
      fontWeight: typography.weights.extrabold,
      color: colors.text,
      marginBottom: spacing.xl,
      letterSpacing: -0.5,
    },
    formCard: {
      backgroundColor: colors.background,
      paddingVertical: spacing.lg,
      gap: spacing.base,
    },
  });
}
