import { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { Button, Input } from "@/components/AuthComponents";
import { colors, typography, spacing } from "@/constants/theme";

export default function OfferRideScreen() {
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
    const t = to.trim();
    const d = date.trim();
    const tm = time.trim();
    const s = parseInt(seats, 10);
    const p = parseFloat(price.replace(",", "."));
    if (!f || !t || !d || !tm || !seats || !price) {
      setError("Please fill From, To, Date, Time, Seats and Price.");
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
    const departureTime = `${d}T${tm}:00.000Z`;
    if (Number.isNaN(Date.parse(departureTime))) {
      setError("Invalid date or time (use YYYY-MM-DD and HH:mm).");
      return;
    }
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
      to_city: t,
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
      <View style={styles.centered}>
        <Text style={styles.successText}>Trip published!</Text>
        <Text style={styles.successSub}>Taking you to My Trips…</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Offer a ride</Text>

        <Input
          label="From"
          value={from}
          onChangeText={setFrom}
          placeholder="City"
          autoCapitalize="words"
        />
        <Input
          label="To"
          value={to}
          onChangeText={setTo}
          placeholder="City"
          autoCapitalize="words"
        />
        <Input
          label="Date"
          value={date}
          onChangeText={setDate}
          placeholder="YYYY-MM-DD"
        />
        <Input
          label="Time"
          value={time}
          onChangeText={setTime}
          placeholder="HH:mm (24h)"
        />
        <Input
          label="Seats"
          value={seats}
          onChangeText={(v) => setSeats(v.replace(/\D/g, ""))}
          placeholder="2"
          keyboardType="number-pad"
        />
        <Input
          label="Price (per seat, den)"
          value={price}
          onChangeText={(v) => setPrice(v.replace(/[^0-9,.]/g, ""))}
          placeholder="350"
          keyboardType="decimal-pad"
        />
        <Input
          label="Pickup note (optional)"
          value={pickupNote}
          onChangeText={setPickupNote}
          placeholder="Where to meet"
          multiline
        />
        <Input
          label="Dropoff note (optional)"
          value={dropoffNote}
          onChangeText={setDropoffNote}
          placeholder="Drop-off point"
          multiline
        />

        {error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : null}

        <Button
          label="Publish"
          onPress={handlePublish}
          loading={loading}
          disabled={loading}
          style={styles.btn}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginBottom: spacing.md,
  },
  btn: { marginTop: spacing.md },
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
