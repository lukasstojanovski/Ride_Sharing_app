import React, { useState, useEffect, useCallback, useMemo } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useI18n } from "../../lib/i18n";
import {
  Button,
  OtpInput,
  BackButton,
  LangToggle,
} from "../../components/AuthComponents";
import { typography, spacing } from "../../constants/theme";
import { useTheme } from "../../lib/ThemeContext";
import type { AppColors } from "../../constants/colorPalettes";

const RESEND_SECONDS = 60;

export default function OtpScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // Params passed from phone.tsx via router.push
  const { phone, displayPhone } = useLocalSearchParams<{
    phone: string;
    displayPhone: string;
  }>();

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleVerify = useCallback(
    async (code: string) => {
      if (code.length < 6) return;
      setError(false);
      setLoading(true);

      try {
        const { data, error } = await supabase.auth.verifyOtp({
          phone,
          token: code,
          type: "sms",
        });

        if (error) throw error;

        // Check if user already has a profile (returning user vs new user)
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, first_name")
          .eq("id", data.user?.id)
          .single();

        if (!profile?.first_name) {
          // New user → create profile
          router.replace("/auth/register");
        } else {
          // Returning user → go to main app
          router.replace("/tabs/home");
        }
      } catch {
        setError(true);
        setOtp("");
      } finally {
        setLoading(false);
      }
    },
    [phone],
  );

  // Auto-submit when all 6 digits entered
  useEffect(() => {
    if (otp.length === 6) handleVerify(otp);
  }, [otp, handleVerify]);

  const handleResend = async () => {
    if (countdown > 0) return;
    setCountdown(RESEND_SECONDS);
    setOtp("");
    setError(false);
    await supabase.auth.signInWithOtp({ phone });
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <BackButton onPress={() => router.back()} />
          <LangToggle language={language} onToggle={toggleLanguage} />
        </View>

        <View style={styles.content}>
          <View style={styles.iconCircle}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>{t.otp.title}</Text>
          <Text style={styles.subtitle}>
            {t.otp.subtitle}
            <Text style={styles.phoneHighlight}>
              {displayPhone}
            </Text>
          </Text>

          <View style={styles.otpArea}>
            <OtpInput value={otp} onChange={setOtp} length={6} error={error} />
            {error && <Text style={styles.errorText}>{t.otp.invalidCode}</Text>}
          </View>

          <View style={styles.resendArea}>
            {countdown > 0 ? (
              <Text style={styles.countdown}>
                {t.otp.resendIn}
                <Text style={styles.countdownNum}>
                  {countdown}
                  {t.otp.seconds}
                </Text>
              </Text>
            ) : (
              <TouchableOpacity onPress={handleResend}>
                <Text style={styles.resendLink}>{t.otp.resend}</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={t.otp.verify}
            onPress={() => handleVerify(otp)}
            loading={loading}
            disabled={otp.length < 6}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: AppColors) {
  return StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
  phoneHighlight: {
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  otpArea: { marginBottom: spacing.xl },
  errorText: {
    textAlign: "center",
    fontSize: typography.sizes.sm,
    color: colors.error,
    marginTop: spacing.sm,
  },
  resendArea: { alignItems: "center" },
  countdown: { fontSize: typography.sizes.base, color: colors.textMuted },
  countdownNum: {
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
  },
  resendLink: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
  },
  footer: { paddingBottom: spacing.xl },
  });
}
