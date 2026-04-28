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

export default function EmailSignupScreen() {
  const { t, toggleLanguage, language } = useI18n();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const validate = () => {
    const e: typeof errors = {};
    if (!email.trim()) {
      e.email = t.emailSignup.emailRequired;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      e.email = t.emailSignup.emailInvalid;
    }
    if (!password) {
      e.password = t.emailSignup.passwordRequired;
    } else if (password.length < 8) {
      e.password = t.emailSignup.passwordTooShort;
    }
    if (password !== confirmPassword) {
      e.confirmPassword = t.emailSignup.passwordMismatch;
    }
    return e;
  };

  const handleNext = () => {
    const e = validate();
    if (Object.keys(e).length > 0) {
      setErrors(e);
      return;
    }

    // Pass credentials to next screen via params
    router.push({
      pathname: "/auth/add-phone",
      params: { email: email.trim(), password, fromSignup: "true" },
    });
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

          {/* Progress: step 1 of 3 */}
          <View style={styles.progressRow}>
            <View style={[styles.stepDot, styles.stepActive]} />
            <View style={styles.stepConnector} />
            <View style={styles.stepDot} />
            <View
              style={[styles.stepConnector, styles.stepConnectorInactive]}
            />
            <View style={styles.stepDot} />
          </View>

          <View style={styles.iconCircle}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>{t.emailSignup.title}</Text>
          <Text style={styles.subtitle}>{t.emailSignup.subtitle}</Text>

          <View style={styles.form}>
            <Input
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (errors.email)
                  setErrors((e) => ({ ...e, email: undefined }));
              }}
              placeholder={t.emailSignup.email}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              error={errors.email}
            />

            <Input
              value={password}
              onChangeText={(v) => {
                setPassword(v);
                if (errors.password)
                  setErrors((e) => ({ ...e, password: undefined }));
              }}
              placeholder={t.emailSignup.password}
              secureTextEntry={!showPassword}
              error={errors.password}
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

            <Input
              value={confirmPassword}
              onChangeText={(v) => {
                setConfirmPassword(v);
                if (errors.confirmPassword)
                  setErrors((e) => ({ ...e, confirmPassword: undefined }));
              }}
              placeholder={t.emailSignup.confirmPassword}
              secureTextEntry={!showPassword}
              error={errors.confirmPassword}
            />
          </View>

          <Button
            label={t.emailSignup.next}
            onPress={handleNext}
            disabled={!email || !password || !confirmPassword}
          />
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
  },
  stepActive: {
    borderColor: colors.primary,
    borderWidth: 2.5,
    backgroundColor: colors.primaryLight,
  },
  stepConnector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.primary,
    marginHorizontal: 4,
  },
  stepConnectorInactive: { backgroundColor: colors.border },

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
});
