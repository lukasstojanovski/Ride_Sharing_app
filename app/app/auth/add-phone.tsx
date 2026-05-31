import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  TouchableOpacity,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { AutoFlatList } from "@/components/AutoFlatList";
import { Button, BackButton, LangToggle } from "@/components/AuthComponents";
import { typography, spacing, radius } from "@/constants/theme";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import {
  europeanCountries,
  defaultCountry,
  Country,
} from "@/constants/countries";

const isSignupFlow = (fromSignup: string | undefined, email: string | undefined) =>
  fromSignup === "true" && !!email;

export default function AddPhoneScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { email, password, fromSignup } = useLocalSearchParams<{
    email?: string;
    password?: string;
    fromSignup?: string;
  }>();

  const signupFlow = isSignupFlow(fromSignup, email);

  const [selectedCountry, setSelectedCountry] =
    useState<Country>(defaultCountry);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [search, setSearch] = useState("");

  const filteredCountries = europeanCountries.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.nameМК.toLowerCase().includes(q) ||
      c.code.includes(q)
    );
  });

  const fullPhone = `${selectedCountry.code}${phone.replace(/^0/, "")}`;

  const handleSave = async () => {
    if (!phone.trim()) {
      setError(t.phone.invalidPhone);
      return;
    }
    setError("");
    if (signupFlow) {
      // Encode phone so "+" is not lost in URL params
      router.push({
        pathname: "/auth/register",
        params: {
          email: email!,
          password: password!,
          phone: encodeURIComponent(fullPhone),
        },
      });
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/tabs/home");
        return;
      }
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ phone: fullPhone })
        .eq("id", user.id);
      if (updateError) throw updateError;
      router.replace("/tabs/home");
    } catch {
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (signupFlow) {
      router.push({
        pathname: "/auth/register",
        params: { email: email!, password: password! },
      });
      return;
    }
    router.replace("/tabs/home");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <View style={styles.container}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <LangToggle language={language} onToggle={toggleLanguage} />
          </View>

          {signupFlow && (
            <View style={styles.progressRow}>
              <View style={[styles.stepDot, styles.stepDone]}>
                <Text style={styles.stepCheck}>✓</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={[styles.stepDot, styles.stepDone]}>
                <Text style={styles.stepCheck}>✓</Text>
              </View>
              <View style={styles.stepConnector} />
              <View style={[styles.stepDot, styles.stepActive]} />
            </View>
          )}

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>📱</Text>
          </View>
          <Text style={styles.title}>{t.phone.title}</Text>
          <Text style={styles.subtitle}>{t.phone.subtitle}</Text>

          {/* Phone input row */}
          <View style={[styles.phoneRow, error ? styles.phoneRowError : null]}>
            {/* Country picker trigger */}
            <TouchableOpacity
              style={styles.countryBtn}
              onPress={() => setPickerVisible(true)}
              activeOpacity={0.7}
            >
              <Text style={styles.flag}>{selectedCountry.flag}</Text>
              <Text style={styles.dialCode}>{selectedCountry.code}</Text>
              <Text style={styles.chevron}>▾</Text>
            </TouchableOpacity>

            <View style={styles.phoneDivider} />

            <TextInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v.replace(/[^0-9 ]/g, ""));
                if (error) setError("");
              }}
              placeholder={t.phone.placeholder}
              placeholderTextColor={colors.textMuted}
              keyboardType="phone-pad"
              style={styles.phoneInput}
              autoFocus
            />
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.actions}>
            <Button
              label={signupFlow ? t.phone.sendCode : t.phone.saveNumber}
              onPress={handleSave}
              loading={loading}
              disabled={!phone.trim()}
            />
            <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
              <Text style={styles.skipText}>{t.phone.skip}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Country Picker Modal */}
      <Modal
        visible={pickerVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setPickerVisible(false)}
      >
        <SafeAreaView style={styles.modalSafe}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t.phone.selectCountry}</Text>
            <TouchableOpacity
              onPress={() => {
                setPickerVisible(false);
                setSearch("");
              }}
            >
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Search */}
          <View style={styles.searchRow}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder={language === "mk" ? "Пребарај..." : "Search..."}
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              autoFocus
            />
          </View>

          <AutoFlatList
            data={filteredCountries}
            keyExtractor={(item) => item.iso}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.countryRow,
                  item.iso === selectedCountry.iso && styles.countryRowSelected,
                ]}
                onPress={() => {
                  setSelectedCountry(item);
                  setPickerVisible(false);
                  setSearch("");
                }}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>
                  {language === "mk" ? item.nameМК : item.name}
                </Text>
                <Text style={styles.countryCode}>{item.code}</Text>
                {item.iso === selectedCountry.iso && (
                  <Text style={styles.countryCheck}>✓</Text>
                )}
              </TouchableOpacity>
            )}
            keyboardShouldPersistTaps="handled"
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.xl },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.base,
    marginBottom: spacing.xl,
  },

  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing["2xl"],
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  stepDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
    backgroundColor: colors.primaryLight,
  },
  stepCheck: { fontSize: 12, color: colors.textInverse, fontWeight: "bold" },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.xl,
  },
  icon: { fontSize: 30 },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: spacing.xs,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: typography.sizes.base * 1.6,
    marginBottom: spacing["2xl"],
  },

  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    height: 54,
    marginBottom: spacing.sm,
  },
  phoneRowError: {
    borderColor: colors.error,
    backgroundColor: colors.errorLight,
  },
  countryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
  },
  flag: { fontSize: 20 },
  dialCode: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  chevron: { fontSize: 10, color: colors.textMuted },
  phoneDivider: { width: 1, height: 24, backgroundColor: colors.border },
  phoneInput: {
    flex: 1,
    paddingHorizontal: spacing.base,
    fontSize: typography.sizes.md,
    color: colors.text,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginBottom: spacing.base,
  },

  actions: { gap: spacing.md, marginTop: spacing.sm },
  skipBtn: { alignItems: "center", paddingVertical: spacing.sm },
  skipText: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },

  // Modal
  modalSafe: { flex: 1, backgroundColor: colors.background },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  modalClose: { fontSize: 18, color: colors.textMuted, padding: spacing.xs },

  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    margin: spacing.base,
    paddingHorizontal: spacing.base,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.lg,
    height: 44,
    gap: spacing.sm,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: typography.sizes.base, color: colors.text },

  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  countryRowSelected: { backgroundColor: colors.primaryLight },
  countryFlag: { fontSize: 24, width: 32 },
  countryName: {
    flex: 1,
    fontSize: typography.sizes.base,
    color: colors.text,
    fontWeight: typography.weights.medium,
  },
  countryCode: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  countryCheck: { fontSize: 16, color: colors.primary, fontWeight: "bold" },
  });
}
