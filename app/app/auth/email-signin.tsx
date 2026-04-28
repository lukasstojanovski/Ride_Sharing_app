import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useI18n } from "@/lib/i18n";
import { Ionicons } from "@expo/vector-icons";
import { AutoScrollView } from "@/components/AutoScrollView";
import {
  Button,
  Input,
  BackButton,
  LangToggle,
} from "@/components/AuthComponents";
import { colors, typography, spacing } from "@/constants/theme";

export default function EmailSigninScreen() {
  const { t, toggleLanguage, language } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    if (!email.trim() || !password) return;
    setError("");
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      router.replace("/tabs/home");
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : t.emailSignin.invalidCredentials;
      setError(message);
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
        <AutoScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          scrollEnabled
          bounces
          alwaysBounceVertical
        >
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <LangToggle language={language} onToggle={toggleLanguage} />
          </View>

          <Text style={styles.title}>{t.emailSignin.title}</Text>
          <Text style={styles.subtitle}>{t.emailSignin.subtitle}</Text>

          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError("");
              }}
              placeholder={t.emailSignin.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
            />

            <Input
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (error) setError("");
              }}
              placeholder={t.emailSignin.password}
              secureTextEntry={!showPassword}
              rightElement={
                <TouchableOpacity onPress={() => setShowPassword((v) => !v)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={22}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>
              }
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={styles.forgotRow}
              onPress={() => router.push("/auth/forgot-password")}
            >
              <Text style={styles.forgotText}>
                {t.emailSignin.forgotPassword}
              </Text>
            </TouchableOpacity>
          </View>

          <Button
            label={t.emailSignin.signIn}
            onPress={handleSignIn}
            loading={loading}
            disabled={!email || !password}
          />

          <View style={styles.signupRow}>
            <Text style={styles.signupPrompt}>{t.emailSignin.noAccount} </Text>
            <TouchableOpacity onPress={() => router.push("/auth/email-signup")}>
              <Text style={styles.signupLink}>{t.emailSignin.signUp}</Text>
            </TouchableOpacity>
          </View>
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.base,
    marginBottom: spacing.xl,
  },

  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: 4,
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
  forgotRow: { alignItems: "flex-end" },
  forgotText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: spacing.xl,
  },
  signupPrompt: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
  },
  signupLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
});
