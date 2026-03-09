import { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input, DatePickerInput, TimePickerInput, CityPickerInput, SeatsStepper } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius, shadows, MAX_SEATS } from "@/constants/theme";

export default function OfferRideScreen() {
  const { t } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useFocusEffect(
    useCallback(() => {
      if (success) {
        setSuccess(false);
        setFrom("");
        setTo("");
        setDate(() => {
          const d = new Date();
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        });
        setTime("");
        setSeats(1);
        setPrice("");
        setError(null);
      }
    }, [success])
  );

  const handlePublish = async () => {
    const f = from.trim();
    const t_val = to.trim();
    const d = date.trim();
    const tm = time.trim();
    const s = seats;
    const p = parseFloat(price.replace(",", "."));
    if (!f || !t_val || !d || !tm || !price) {
      setError(t.offer.fillRequired);
      return;
    }
    if (s < 1 || s > MAX_SEATS) {
      setError(`Seats must be between 1 and ${MAX_SEATS}.`);
      return;
    }
    if (isNaN(p) || p < 0) {
      setError("Price must be 0 or more.");
      return;
    }
    const [year, month, day] = d.split("-").map(Number);
    const [hour, minute] = tm.split(":").map(Number);
    const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);
    if (Number.isNaN(localDate.getTime())) {
      setError("Invalid date or time.");
      return;
    }
    const departureTime = localDate.toISOString();
    setError(null);
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setError("You must be logged in.");
      return;
    }
    const { error: e } = await supabase.from("trips").insert({
      creator_id: user.id,
      from_city: f,
      to_city: t_val,
      departure_time: departureTime,
      seats_total: s,
      seats_available: s,
      price: p,
      status: "active",
    });
    setLoading(false);
    if (e) {
      setError(e.message);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      router.push("/tabs/my-trips");
    }, 1500);
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.successText}>{t.offer.success}</Text>
          <Text style={styles.successSub}>{t.offer.successSub}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppHeader />

          <Text style={styles.title}>{t.offer.title}</Text>

          <View style={styles.formCard}>
            <CityPickerInput
              label={t.offer.from}
              value={from}
              onChange={setFrom}
              placeholder="Скопје"
            />
            <CityPickerInput
              label={t.offer.to}
              value={to}
              onChange={setTo}
              placeholder="Охрид"
            />
            <DatePickerInput
              label={t.offer.date}
              value={date}
              onChange={setDate}
              placeholder={t.offer.datePlaceholder}
            />
            <TimePickerInput
              label={t.offer.time}
              value={time}
              onChange={setTime}
              placeholder={t.offer.timePlaceholder}
            />
            <SeatsStepper
              label={t.offer.seats}
              value={seats}
              onChange={setSeats}
            />
            <Input
              label={t.offer.price}
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^0-9,.]/g, ""))}
              placeholder="350"
              keyboardType="decimal-pad"
            />

            {error ? (
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            <Button
              label={t.offer.publish}
              onPress={handlePublish}
              loading={loading}
              disabled={loading}
              style={styles.btn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.primary,
    gap: spacing.base,
    ...shadows.md,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  btn: { marginTop: spacing.sm },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  successText: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.success,
    marginBottom: spacing.sm,
  },
  successSub: { fontSize: typography.sizes.base, color: colors.textSecondary },
});
