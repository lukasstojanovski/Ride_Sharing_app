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
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import {
  Button,
  Input,
  BackButton,
  LangToggle,
} from "@/components/AuthComponents";
import { colors, typography, spacing } from "@/constants/theme";

export default function ForgotPasswordScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email.trim()) return;
    setError("");
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        { redirectTo: undefined }
      );
      if (err) throw err;
      setSent(true);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t.error;
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.sentContainer}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <LangToggle language={language} onToggle={toggleLanguage} />
          </View>
          <Text style={styles.sentEmoji}>✉️</Text>
          <Text style={styles.sentTitle}>{t.forgotPassword.successMessage}</Text>
          <Button
            label={t.forgotPassword.backToSignIn}
            onPress={() => router.replace("/auth/email-signin")}
            variant="primary"
          />
        </View>
      </SafeAreaView>
    );
  }

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

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>🔑</Text>
          </View>
          <Text style={styles.title}>{t.forgotPassword.title}</Text>
          <Text style={styles.subtitle}>{t.forgotPassword.subtitle}</Text>

          <View style={styles.form}>
            <Input
              label={t.forgotPassword.email}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError("");
              }}
              placeholder={t.forgotPassword.emailPlaceholder}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Button
            label={t.forgotPassword.sendReset}
            onPress={handleSendReset}
            loading={loading}
            disabled={!email.trim()}
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
    marginBottom: spacing["2xl"],
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
    marginBottom: spacing["2xl"],
  },

  form: { gap: spacing.base, marginBottom: spacing.xl },
  errorText: {
    fontSize: typography.sizes.sm,
    color: colors.error,
    textAlign: "center",
  },

  sentContainer: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing["3xl"],
  },
  sentEmoji: { fontSize: 64, textAlign: "center", marginBottom: spacing.xl },
  sentTitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    textAlign: "center",
    marginBottom: spacing["2xl"],
  },
});
