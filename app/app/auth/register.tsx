import React, { useState, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { AutoScrollView } from "@/components/AutoScrollView";
import {
  Button,
  Input,
  BackButton,
  LangToggle,
} from "@/components/AuthComponents";
import { typography, spacing, radius } from "@/constants/theme";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";

export default function RegisterScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Passed from email-signup → add-phone → register (phone may be URI-encoded to preserve "+")
  const params = useLocalSearchParams<{
    email: string;
    password: string;
    phone?: string;
  }>();
  const email = params.email;
  const password = params.password;
  const phone = params.phone
    ? (() => {
        try {
          return decodeURIComponent(params.phone!);
        } catch {
          return params.phone!;
        }
      })()
    : undefined;

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    general?: string;
  }>({});

  const capitalizeName = (str: string) =>
    str
      .split(/\s+/)
      .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : word))
      .join(" ")
      .trim();

  const validate = () => {
    const e: typeof errors = {};
    if (!firstName.trim()) e.firstName = t.register.firstNameRequired;
    if (!lastName.trim()) e.lastName = t.register.lastNameRequired;
    return e;
  };

  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    setLoading(true);
    try {
      const first = capitalizeName(firstName.trim());
      const last = capitalizeName(lastName.trim());
      const fullName = [first, last].filter(Boolean).join(" ").trim();
      // 1. Create the auth user; trigger on auth.users creates the profile row (no client write = no RLS issue)
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: first,
            last_name: last,
            full_name: fullName || undefined,
            phone: phone || null,
          },
        },
      });

      if (signUpError) throw signUpError;

      // 2. Profile row is created by DB trigger. If we have a session and a phone, also update the profile from the client as a fallback.
      if (data.user && data.session && phone) {
        await supabase
          .from("profiles")
          .update({ phone: String(phone).trim() })
          .eq("id", data.user.id);
      }

      router.replace("/signup-success");
    } catch (err: any) {
      setErrors({ general: err.message || t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <AutoScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <LangToggle language={language} onToggle={toggleLanguage} />
          </View>

          {/* Progress: step 2 of 3 */}
          <View style={styles.progressRow}>
            <View style={[styles.stepDot, styles.stepDone]}>
              <Text style={styles.stepCheck}>✓</Text>
            </View>
            <View style={styles.stepConnector} />
            <View style={[styles.stepDot, styles.stepActive]} />
            <View
              style={[styles.stepConnector, styles.stepConnectorInactive]}
            />
            <View style={styles.stepDot} />
          </View>

          <View style={styles.avatarCircle}>
            <Text style={styles.avatarEmoji}>👤</Text>
          </View>
          <Text style={styles.title}>{t.register.title}</Text>
          <Text style={styles.subtitle}>{t.register.subtitle}</Text>

          <View style={styles.form}>
            <Input
              label={t.register.firstName}
              value={firstName}
              onChangeText={(v) => {
                setFirstName(v);
                if (errors.firstName)
                  setErrors((e) => ({ ...e, firstName: undefined }));
              }}
              placeholder="Иван"
              autoCapitalize="words"
              autoFocus
              error={errors.firstName}
            />
            <Input
              label={t.register.lastName}
              value={lastName}
              onChangeText={(v) => {
                setLastName(v);
                if (errors.lastName)
                  setErrors((e) => ({ ...e, lastName: undefined }));
              }}
              placeholder="Петровски"
              autoCapitalize="words"
              error={errors.lastName}
            />
            {errors.general ? (
              <Text style={styles.errorText}>{errors.general}</Text>
            ) : null}
          </View>

          <View style={styles.privacyNote}>
            <Text style={styles.privacyIcon}>🔒</Text>
            <Text style={styles.privacyText}>{t.register.privacy}</Text>
          </View>

          <Button
            label={t.register.createAccount}
            onPress={handleCreate}
            loading={loading}
            disabled={!firstName.trim() || !lastName.trim()}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },

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
  stepConnectorInactive: { backgroundColor: colors.border },

  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.base,
  },
  avatarEmoji: { fontSize: 32, opacity: 0.4 },
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
    marginBottom: spacing["2xl"],
  },

  form: { gap: spacing.base, marginBottom: spacing.xl },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: "center",
  },

  privacyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.base,
    marginBottom: spacing.xl,
  },
  privacyIcon: { fontSize: 14, marginTop: 1 },
  privacyText: {
    flex: 1,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.6,
  },
  });
}
