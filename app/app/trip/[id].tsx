import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { AutoScrollView } from "@/components/AutoScrollView";
import { Button } from "@/components/AuthComponents";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

type Trip = {
  id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  seats_available: number;
  seats_total: number;
  price: number;
  pickup_note: string | null;
  dropoff_note: string | null;
  profiles: { full_name: string | null } | null;
};

export default function TripDetailsScreen() {
  const { t } = useI18n();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [requestSent, setRequestSent] = useState(false);
  const [seatsModalVisible, setSeatsModalVisible] = useState(false);
  const [seatsRequested, setSeatsRequested] = useState("1");
  const [conversationId, setConversationId] = useState<string | null>(null);

  const fetchTrip = useCallback(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from("trips")
      .select("id, from_city, to_city, departure_time, seats_available, seats_total, price, pickup_note, dropoff_note, profiles!creator_id(full_name)")
      .eq("id", id)
      .single()
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          setTrip(null);
          return;
        }
        setTrip(data as Trip);
      });
  }, [id]);

  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (!id) return;
    supabase.rpc("get_conversation_for_trip", { p_trip_id: id }).then(({ data }) => {
      setConversationId((data as string | null) ?? null);
    });
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const channel = supabase
      .channel(`trip-${id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips", filter: `id=eq.${id}` },
        fetchTrip
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, fetchTrip]);

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const dateStr = `${day}/${month}/${d.getFullYear()}`;
      const timeStr = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", hour12: false });
      return `${dateStr} ${timeStr}`;
    } catch {
      return iso;
    }
  };

  const handleRequestSeats = async () => {
    if (!trip || !id) return;
    const num = Math.max(1, parseInt(seatsRequested, 10) || 1);
    if (num > trip.seats_available) {
      setError("Not enough seats available");
      setSeatsModalVisible(false);
      return;
    }
    setRequesting(true);
    const { data, error: e } = await supabase.rpc("create_reservation", {
      p_trip_id: id,
      p_seats_requested: num,
    });
    setRequesting(false);
    setSeatsModalVisible(false);
    if (e) {
      setError(e.message);
      return;
    }
    const result = data as { ok?: boolean; message?: string };
    if (!result?.ok) {
      setError(result?.message ?? "Failed to create reservation");
      return;
    }
    setRequestSent(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (error && !trip) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>{t.trip.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!trip) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <AutoScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader showBack onBack={() => router.back()} />

        <Text style={styles.route}>
        {trip.from_city} → {trip.to_city}
      </Text>
      <Text style={styles.dateTime}>{formatDateTime(trip.departure_time)}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.trip.tripDetails}</Text>
        <View style={styles.row}>
          <Text style={styles.label}>{t.trip.seatsAvailable}</Text>
          <Text style={styles.value}>{trip.seats_available} / {trip.seats_total}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>{t.trip.pricePerSeat}</Text>
          <Text style={styles.value}>{trip.price} den</Text>
        </View>
        {trip.pickup_note ? (
          <View style={styles.row}>
            <Text style={styles.label}>{t.trip.pickupNote}</Text>
            <Text style={styles.value}>{trip.pickup_note}</Text>
          </View>
        ) : null}
        {trip.dropoff_note ? (
          <View style={styles.row}>
            <Text style={styles.label}>{t.trip.dropoffNote}</Text>
            <Text style={styles.value}>{trip.dropoff_note}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t.trip.driver}</Text>
        <Text style={styles.driverName}>
          {trip.profiles?.full_name ?? "—"}
        </Text>
      </View>

      {conversationId ? (
        <Button
          label={t.trip.chat}
          variant="outline"
          onPress={() => router.push(`/chat/${conversationId}`)}
          style={styles.chatBtn}
        />
      ) : null}

      {requestSent ? (
        <View style={styles.sent}>
          <Text style={styles.sentText}>{t.trip.requestSent}</Text>
        </View>
      ) : trip.seats_available > 0 ? (
        <Button
          label={t.trip.requestSeats}
          onPress={() => setSeatsModalVisible(true)}
          style={styles.btn}
        />
      ) : (
        <Text style={styles.full}>{t.trip.full}</Text>
      )}

      {error ? (
        <Text style={[styles.errorText, { marginTop: spacing.md }]}>{error}</Text>
      ) : null}

      <Modal
        visible={seatsModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSeatsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{t.trip.numSeats}</Text>
            <TextInput
              value={seatsRequested}
              onChangeText={(v) => setSeatsRequested(v.replace(/\D/g, "") || "1")}
              keyboardType="number-pad"
              style={styles.modalInput}
              placeholder="1"
            />
            <View style={styles.modalRow}>
              <Button
                label="Cancel"
                variant="outline"
                onPress={() => setSeatsModalVisible(false)}
                style={styles.modalBtn}
              />
              <Button
                label={t.trip.sendRequest}
                onPress={handleRequestSeats}
                loading={requesting}
                disabled={requesting}
                style={styles.modalBtn}
              />
            </View>
          </View>
        </View>
      </Modal>
    </AutoScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: { color: colors.error, textAlign: "center" },
  link: {
    marginTop: spacing.md,
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  route: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  dateTime: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  row: { marginBottom: spacing.sm },
  label: { fontSize: typography.sizes.sm, color: colors.textMuted },
  value: { fontSize: typography.sizes.base, color: colors.text, marginTop: 2 },
  driverName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  chatBtn: { marginTop: spacing.lg },
  btn: { marginTop: spacing.lg },
  sent: {
    marginTop: spacing.lg,
    padding: spacing.base,
    backgroundColor: colors.primaryLight,
    borderRadius: radius.md,
  },
  sentText: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.medium,
    textAlign: "center",
  },
  full: {
    marginTop: spacing.lg,
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalBox: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: "100%",
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.base,
    fontSize: typography.sizes.base,
    color: colors.text,
    marginBottom: spacing.lg,
  },
  modalRow: {
    flexDirection: "row",
    gap: spacing.md,
  },
  modalBtn: { flex: 1 },
});
