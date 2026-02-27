import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../lib/i18n";
import {
  Button,
  PhoneInput,
  BackButton,
  LangToggle,
} from "../../components/AuthComponents";
import { colors, typography, spacing } from "../../constants/theme";

export default function PhoneScreen() {
  const { t, toggleLanguage, language } = useI18n();

  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isValidPhone = (raw: string) => {
    const clean = raw.replace(/\s/g, "");
    return /^07[0-9]{7,8}$/.test(clean);
  };

  const formatPhone = (raw: string) => {
    const clean = raw.replace(/\s/g, "");
    return clean.startsWith("0") ? `+389${clean.slice(1)}` : `+389${clean}`;
  };

  const handleSendCode = async () => {
    if (!isValidPhone(phone)) {
      setError(t.phone.invalidPhone);
      return;
    }

    setError("");
    setLoading(true);

    try {
      const formattedPhone = formatPhone(phone);

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) throw error;

      // Pass phone via route params to OTP screen
      router.push({
        pathname: "/auth/otp",
        params: { phone: formattedPhone, displayPhone: phone },
      });
    } catch (err: any) {
      setError(err.message || t.error);
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
        <View style={styles.container}>
          <View style={styles.topBar}>
            <BackButton onPress={() => router.back()} />
            <LangToggle language={language} onToggle={toggleLanguage} />
          </View>

          <View style={styles.content}>
            <View style={styles.iconCircle}>
              <Text style={styles.icon}>📱</Text>
            </View>
            <Text style={styles.title}>{t.phone.title}</Text>
            <Text style={styles.subtitle}>{t.phone.subtitle}</Text>

            <PhoneInput
              value={phone}
              onChangeText={(v) => {
                setPhone(v);
                if (error) setError("");
              }}
              countryCode="+389"
              placeholder={t.phone.placeholder}
              autoFocus
              error={error}
            />
          </View>

          <View style={styles.footer}>
            <Button
              label={t.phone.sendCode}
              onPress={handleSendCode}
              loading={loading}
              disabled={phone.length < 8}
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  kav: { flex: 1 },
  container: { flex: 1, paddingHorizontal: spacing.xl },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.base,
    marginBottom: spacing["3xl"],
  },
  content: { flex: 1 },
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
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    lineHeight: typography.sizes.base * 1.6,
    marginBottom: spacing["2xl"],
  },
  footer: { paddingBottom: spacing.xl },
});
