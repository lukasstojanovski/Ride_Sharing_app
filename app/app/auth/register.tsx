import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import {
  Button,
  Input,
  BackButton,
  LangToggle,
} from "@/components/AuthComponents";
import { colors, typography, spacing, radius } from "@/constants/theme";

export default function RegisterScreen() {
  const { t, toggleLanguage, language } = useI18n();

  // Passed from email-signup.tsx
  const { email, password, phone } = useLocalSearchParams<{
    email: string;
    password: string;
    phone?: string;
  }>();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{
    firstName?: string;
    lastName?: string;
    general?: string;
  }>({});

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
      // 1. Create the auth user
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Skip email confirmation for easier testing
          // To re-enable: remove emailRedirectTo and turn on "Confirm email" in Supabase dashboard
          data: {
            first_name: firstName.trim(),
            last_name: lastName.trim(),
          },
        },
      });

      if (signUpError) throw signUpError;

      // 2. Create the profile row
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          full_name: `${firstName.trim()} ${lastName.trim()}`,
          email: email,
          phone: phone || null,
          phone_verified: false,
          updated_at: new Date().toISOString(),
        });
        if (profileError) throw profileError;
      }

      // 3. Go to phone screen (phone verification skipped for now — user can skip)
      console.log("About to redirect to success screen");

      router.replace("/tabs/signup-success");
    } catch (err: any) {
      setErrors({ general: err.message || t.error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.kav}
      >
        <ScrollView
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
