import { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { SettingsPicker } from "@/components/SettingsPicker";
import { useI18n } from "@/lib/i18n";
import { useTheme, ThemeMode } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { typography, spacing, radius } from "@/constants/theme";
import { supabase } from "@/lib/supabase";

export default function ProfileSettingsScreen() {
  const { t, language, setLanguage } = useI18n();
  const { colors, themeMode, setThemeMode } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleLogOut = () => {
    Alert.alert(
      t.home.logOut,
      language === "mk"
        ? "Дали сте сигурни дека сакате да се одјавите?"
        : "Are you sure you want to log out?",
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.home.logOut,
          style: "destructive",
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace("/login");
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t.profile.deleteAccount,
      language === "mk"
        ? "Ова ќе ја избрише вашата сметка, е-пошта, лозинка и сите податоци. Нема да можете да се вратите. Дали сте сигурни?"
        : "This will permanently delete your account, email, password and all saved data. You will not be able to sign in again. Are you sure?",
      [
        { text: t.common.cancel, style: "cancel" },
        {
          text: t.profile.deleteAccount,
          style: "destructive",
          onPress: async () => {
            setDeletingAccount(true);
            setError(null);
            try {
              const { data, error: fnError } = await supabase.functions.invoke("delete-account");
              if (fnError) {
                setError(fnError.message || "Failed to delete account");
                setDeletingAccount(false);
                return;
              }
              const body = data as { ok?: boolean; message?: string } | null;
              if (body && !body.ok) {
                setError(body.message || "Failed to delete account");
                setDeletingAccount(false);
                return;
              }
              await supabase.auth.signOut();
              router.replace("/login");
            } catch {
              router.replace("/login");
            } finally {
              setDeletingAccount(false);
            }
          },
        },
      ]
    );
  };

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

          <TouchableOpacity
            onPress={handleLogOut}
            style={styles.logOutRow}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            <View style={styles.logOutRowLeft}>
              <Ionicons name="log-out-outline" size={22} color={colors.text} />
              <Text style={styles.logOutRowText}>{t.home.logOut}</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleDeleteAccount}
            style={[styles.logOutRow, styles.deleteAccountRow, deletingAccount && styles.actionRowDisabled]}
            activeOpacity={0.8}
            disabled={deletingAccount}
          >
            <View style={styles.logOutRowLeft}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
              <Text style={styles.deleteAccountBtnText}>
                {deletingAccount
                  ? language === "mk"
                    ? "Се брише…"
                    : "Deleting…"
                  : t.profile.deleteAccount}
              </Text>
            </View>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
    logOutRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.base,
      borderRadius: radius.lg,
      backgroundColor: colors.surfaceAlt,
      marginTop: spacing.xl,
    },
    logOutRowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    logOutRowText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.text,
    },
    deleteAccountRow: {
      marginTop: 0,
    },
    actionRowDisabled: {
      opacity: 0.6,
    },
    deleteAccountBtnText: {
      fontSize: typography.sizes.base,
      fontWeight: typography.weights.medium,
      color: colors.error,
    },
    errorText: {
      color: colors.error,
      fontSize: typography.sizes.sm,
      marginTop: spacing.xs,
    },
  });
}
