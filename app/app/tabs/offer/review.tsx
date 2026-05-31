import { useMemo } from "react";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/AuthComponents";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { useTheme } from "@/lib/ThemeContext";
import type { AppColors } from "@/constants/colorPalettes";
import { MAX_SEATS, spacing, typography } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { useOfferWizard } from "./OfferWizardContext";
import { useOfferStepStyles } from "./stepStyles";

export default function OfferReviewScreen() {
  const { t } = useI18n();
  const stepStyles = useOfferStepStyles();
  const {
    from,
    to,
    date,
    time,
    seats,
    vehicleInfo,
    smokingAllowed,
    petsAllowed,
    price,
    pickupAddress,
    pickupLat,
    pickupLng,
    dropoffAddress,
    dropoffLat,
    dropoffLng,
    error,
    setError,
    loading,
    setLoading,
    success,
    setSuccess,
    resetWizard,
    clearOfferDraft,
    remountStack,
  } = useOfferWizard();

  const handlePublish = async () => {
    const f = from.trim();
    const tVal = to.trim();
    const d = date.trim();
    const tm = time.trim();
    const p = parseFloat(price.replace(",", "."));
    if (!f || !tVal || !d || !tm) {
      setError(t.offer.fillRequired);
      return;
    }
    if (pickupLat === null || pickupLng === null) {
      setError(t.offer.pickupRequired);
      return;
    }
    if (dropoffLat === null || dropoffLng === null) {
      setError(t.offer.dropoffRequired);
      return;
    }
    if (f === tVal) {
      setError(t.offer.pickFromDifferentCity);
      return;
    }
    if (seats < 1 || seats > MAX_SEATS) {
      setError(t.offer.invalidSeats);
      return;
    }
    if (!price.trim() || Number.isNaN(p) || p < 0) {
      setError(t.offer.fillDetailsRequired);
      return;
    }
    const [year, month, day] = d.split("-").map(Number);
    const [hour, minute] = tm.split(":").map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (Number.isNaN(localDate.getTime())) {
      setError(t.offer.invalidDateTime);
      return;
    }
    const departureTime = localDate.toISOString();
    setError(null);
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError(t.offer.loginRequired);
      return;
    }
    const vehicle = vehicleInfo.trim();
    const { error: e } = await supabase.from("trips").insert({
      creator_id: user.id,
      from_city: f,
      to_city: tVal,
      departure_time: departureTime,
      seats_total: seats,
      seats_available: seats,
      price: p,
      status: "active",
      vehicle_info: vehicle.length > 0 ? vehicle : null,
      smoking_allowed: smokingAllowed,
      pets_allowed: petsAllowed,
      pickup_address: pickupAddress.trim() || null,
      pickup_lat: pickupLat,
      pickup_lng: pickupLng,
      dropoff_address: dropoffAddress.trim() || null,
      dropoff_lat: dropoffLat,
      dropoff_lng: dropoffLng,
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSuccess(true);
    clearOfferDraft();
    setTimeout(() => {
      router.push("/tabs/my-trips");
      resetWizard();
      remountStack();
    }, 1500);
  };

  if (success) {
    return (
      <SafeAreaView style={stepStyles.safe}>
        <View style={stepStyles.centered}>
          <Text style={stepStyles.successText}>{t.offer.success}</Text>
          <Text style={stepStyles.successSub}>{t.offer.successSub}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={stepStyles.safe}>
      <KeyboardAvoidingView
        style={stepStyles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <AutoScrollView
          contentContainerStyle={stepStyles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          scrollEnabled
          bounces
          alwaysBounceVertical
        >
          <AppHeader showBack onBack={() => router.back()} title={t.offer.title} />

          <Text style={stepStyles.title}>{t.offer.reviewTitle}</Text>
          <Text style={stepStyles.subtitle}>{t.offer.reviewSubtitle}</Text>

          <View style={stepStyles.formCard}>
            <ReviewRow label={`${t.offer.from} -> ${t.offer.to}`} value={`${from} -> ${to}`} />
            <ReviewRow label={t.offer.date} value={`${date} ${time}`} />
            <ReviewRow label={t.offer.seats} value={String(seats)} />
            <ReviewRow
              label={t.offer.pickupTitle}
              value={pickupAddress || `${pickupLat?.toFixed(5)}, ${pickupLng?.toFixed(5)}`}
            />
            <ReviewRow
              label={t.offer.dropoffTitle}
              value={dropoffAddress || `${dropoffLat?.toFixed(5)}, ${dropoffLng?.toFixed(5)}`}
            />
            <ReviewRow label={t.offer.vehicleInfo} value={vehicleInfo || "-"} />
            <ReviewRow label={t.offer.smoking} value={smokingAllowed ? "Yes" : "No"} />
            <ReviewRow label={t.offer.pets} value={petsAllowed ? "Yes" : "No"} />
            <ReviewRow label={t.offer.price} value={price} />
          </View>

          {error ? <Text style={stepStyles.errorText}>{error}</Text> : null}

          <Button
            label={t.offer.publish}
            onPress={handlePublish}
            loading={loading}
            disabled={loading}
            style={stepStyles.btn}
          />
        </AutoScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  const styles = useMemo(() => createReviewRowStyles(colors), [colors]);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

function createReviewRowStyles(colors: AppColors) {
  return StyleSheet.create({
    row: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: spacing.sm,
      marginBottom: spacing.sm,
    },
    label: {
      fontSize: typography.sizes.sm,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    value: {
      fontSize: typography.sizes.base,
      color: colors.text,
      fontWeight: typography.weights.medium,
    },
  });
}
