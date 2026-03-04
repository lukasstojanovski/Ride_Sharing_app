import { useState } from "react";
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
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input, DatePickerInput, TimePickerInput, CityPickerInput } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { LangToggle } from "@/components/AuthComponents";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

export default function OfferRideScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState("");
  const [price, setPrice] = useState("");
  const [pickupNote, setPickupNote] = useState("");
  const [dropoffNote, setDropoffNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handlePublish = async () => {
    const f = from.trim();
    const t_val = to.trim();
    const d = date.trim();
    const tm = time.trim();
    const s = parseInt(seats, 10);
    const p = parseFloat(price.replace(",", "."));
    if (!f || !t_val || !d || !tm || !seats || !price) {
      setError(t.offer.fillRequired);
      return;
    }
    if (isNaN(s) || s < 1) {
      setError("Seats must be at least 1.");
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
      pickup_note: pickupNote.trim() || null,
      dropoff_note: dropoffNote.trim() || null,
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
          <AppHeader rightElement={<LangToggle language={language} onToggle={toggleLanguage} />} />

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
            <Input
              label={t.offer.seats}
              value={seats}
              onChangeText={(v) => setSeats(v.replace(/\D/g, ""))}
              placeholder="2"
              keyboardType="number-pad"
            />
            <Input
              label={t.offer.price}
              value={price}
              onChangeText={(v) => setPrice(v.replace(/[^0-9,.]/g, ""))}
              placeholder="350"
              keyboardType="decimal-pad"
            />
            <Input
              label={t.offer.pickupNote}
              value={pickupNote}
              onChangeText={setPickupNote}
              placeholder="Where to meet"
              multiline
            />
            <Input
              label={t.offer.dropoffNote}
              value={dropoffNote}
              onChangeText={setDropoffNote}
              placeholder="Drop-off point"
              multiline
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
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.base,
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
