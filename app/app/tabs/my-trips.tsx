import { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
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
  status: string;
};

type ReservationWithTrip = {
  id: string;
  trip_id: string;
  seats_requested: number;
  status: string;
  trips: Trip & { profiles: { full_name: string | null } | null };
};

type ReservationWithPassenger = {
  id: string;
  trip_id: string;
  seats_requested: number;
  status: string;
  profiles: { full_name: string | null } | null;
};

export default function MyTripsScreen() {
  const { t } = useI18n();
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<"driving" | "riding">(
    tab === "riding" ? "riding" : "driving"
  );

  useEffect(() => {
    if (tab === "riding") setActiveTab("riding");
  }, [tab]);
  const [myTrips, setMyTrips] = useState<Trip[]>([]);
  const [reservationsByTrip, setReservationsByTrip] = useState<
    Record<string, ReservationWithPassenger[]>
  >({});
  const [myReservations, setMyReservations] = useState<ReservationWithTrip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const [tripsRes, reservationsRes] = await Promise.all([
      supabase
        .from("trips")
        .select("*")
        .eq("creator_id", user.id)
        .order("departure_time", { ascending: false }),
      supabase
        .from("reservations")
        .select("*, trips(*, profiles!creator_id(full_name))")
        .eq("passenger_id", user.id)
        .order("created_at", { ascending: false }),
    ]);
    const trips = (tripsRes.data as Trip[]) || [];
    if (tripsRes.error) {
      setError(tripsRes.error.message);
      setMyTrips([]);
    } else {
      setMyTrips(trips);
    }
    if (reservationsRes.error) {
      setMyReservations([]);
    } else {
      setMyReservations((reservationsRes.data as ReservationWithTrip[]) || []);
    }
    const tripIds = trips.map((t) => t.id);
    const byTrip: Record<string, ReservationWithPassenger[]> = {};
    if (tripIds.length > 0) {
      const { data: allRes } = await supabase
        .from("reservations")
        .select("id, trip_id, seats_requested, status, profiles!passenger_id(full_name)")
        .in("trip_id", tripIds);
      const list = (allRes as ReservationWithPassenger[]) || [];
      for (const r of list) {
        if (!byTrip[r.trip_id]) byTrip[r.trip_id] = [];
        byTrip[r.trip_id].push(r);
      }
    }
    setReservationsByTrip(byTrip);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("my-trips-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, () => load())
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, () => load())
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAccept = async (reservationId: string) => {
    setActionLoading(reservationId);
    setError(null);
    const { data, error: e } = await supabase.rpc("accept_reservation", {
      reservation_id: reservationId,
    });
    setActionLoading(null);
    if (e) {
      setError(e.message);
      return;
    }
    const result = data as { ok?: boolean; message?: string };
    if (!result?.ok) {
      setError(result?.message ?? "Failed to accept");
      return;
    }
    await load();
  };

  const handleDecline = async (reservationId: string) => {
    setActionLoading(reservationId);
    setError(null);
    const { data, error: e } = await supabase.rpc("decline_reservation", {
      p_reservation_id: reservationId,
    });
    setActionLoading(null);
    if (e) {
      setError(e.message);
      return;
    }
    const result = data as { ok?: boolean; message?: string };
    if (!result?.ok) {
      setError(result?.message ?? "Failed to decline");
      return;
    }
    await load();
  };

  const handleCancelTrip = async (tripId: string) => {
    setActionLoading(tripId);
    setError(null);
    const { data, error: e } = await supabase.rpc("cancel_trip", {
      p_trip_id: tripId,
    });
    setActionLoading(null);
    if (e) {
      setError(e.message);
      return;
    }
    const result = data as { ok?: boolean; message?: string };
    if (!result?.ok) {
      setError(result?.message ?? "Failed to cancel trip");
      return;
    }
    await load();
  };

  const handleOpenChat = async (tripId: string) => {
    const { data, error: e } = await supabase.rpc("get_conversation_for_trip", {
      p_trip_id: tripId,
    });
    if (!e && data) {
      router.push(`/chat/${data}`);
    }
  };

  const hasAcceptedReservation = (tripId: string) =>
    (reservationsByTrip[tripId] || []).some((r) => r.status === "accepted");

  const handleCancelReservation = async (reservationId: string) => {
    setActionLoading(reservationId);
    setError(null);
    const { data, error: e } = await supabase.rpc("cancel_reservation", {
      reservation_id: reservationId,
    });
    setActionLoading(null);
    if (e) {
      setError(e.message);
      return;
    }
    const result = data as { ok?: boolean; message?: string };
    if (!result?.ok) {
      setError(result?.message ?? "Failed to cancel reservation");
      return;
    }
    await load();
  };

  const formatDate = (iso: string) => {
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

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.headerWrap}>
        <AppHeader />
      </View>
      <View style={styles.container}>
        <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "driving" && styles.tabActive]}
          onPress={() => setActiveTab("driving")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "driving" && styles.tabTextActive,
            ]}
          >
            {t.myTrips.driving}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "riding" && styles.tabActive]}
          onPress={() => setActiveTab("riding")}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === "riding" && styles.tabTextActive,
            ]}
          >
            {t.myTrips.riding}
          </Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <AutoScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true) || load()} />
        }
      >
        {activeTab === "driving" && (
          <>
            {myTrips.length === 0 ? (
              <Text style={styles.empty}>{t.myTrips.noTrips}</Text>
            ) : (
              myTrips.map((trip) => (
                <View key={trip.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardRoute}>
                      {trip.from_city} → {trip.to_city}
                    </Text>
                    <Text style={styles.cardStatus}>{trip.status}</Text>
                  </View>
                  <Text style={styles.cardDate}>{formatDate(trip.departure_time)}</Text>
                  <Text style={styles.cardMeta}>
                    {trip.seats_available} / {trip.seats_total} seats · {trip.price} den
                  </Text>
                  {(reservationsByTrip[trip.id] || []).length > 0 && (
                    <View style={styles.resList}>
                      <Text style={styles.resTitle}>{t.myTrips.requests}</Text>
                      {(reservationsByTrip[trip.id] || []).map((res) => (
                        <View key={res.id} style={styles.resRow}>
                          <Text style={styles.resText}>
                            {res.profiles?.full_name ?? "—"} · {res.seats_requested} seat(s) ·{" "}
                            {res.status}
                          </Text>
                          {res.status === "pending" && trip.status === "active" && (
                            <View style={styles.resActions}>
                              <Button
                                label={t.myTrips.accept}
                                onPress={() => handleAccept(res.id)}
                                loading={actionLoading === res.id}
                                disabled={!!actionLoading}
                                style={styles.resBtn}
                              />
                              <Button
                                label={t.myTrips.decline}
                                variant="outline"
                                onPress={() => handleDecline(res.id)}
                                loading={actionLoading === res.id}
                                disabled={!!actionLoading}
                                style={styles.resBtn}
                              />
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                  {hasAcceptedReservation(trip.id) && (
                    <Button
                      label={t.myTrips.chat}
                      onPress={() => handleOpenChat(trip.id)}
                      variant="outline"
                      style={styles.chatBtn}
                    />
                  )}
                  {trip.status === "active" && (
                    <Button
                      label={t.myTrips.cancelTrip}
                      variant="outline"
                      onPress={() =>
                        Alert.alert(
                          t.myTrips.cancelTripConfirm,
                          t.myTrips.cancelTripMessage,
                          [
                            { text: t.common.cancel, style: "cancel" },
                            { text: t.common.confirm, onPress: () => handleCancelTrip(trip.id) },
                          ]
                        )
                      }
                      loading={actionLoading === trip.id}
                      disabled={!!actionLoading}
                      style={styles.cancelBtn}
                    />
                  )}
                </View>
              ))
            )}
          </>
        )}

        {activeTab === "riding" && (
          <>
            {myReservations.length === 0 ? (
              <Text style={styles.empty}>{t.myTrips.noBookings}</Text>
            ) : (
              myReservations.map((res) => (
                <View key={res.id} style={styles.card}>
                  <TouchableOpacity
                    onPress={() => router.push(`/trip/${res.trip_id}`)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.cardRoute}>
                      {res.trips.from_city} → {res.trips.to_city}
                    </Text>
                    <Text style={styles.cardDate}>{formatDate(res.trips.departure_time)}</Text>
                    <Text style={styles.cardMeta}>
                      Driver: {res.trips.profiles?.full_name ?? "—"} · {res.seats_requested} seat(s)
                    </Text>
                    <Text style={styles.cardStatus}>{res.status}</Text>
                  </TouchableOpacity>
                  {res.status === "accepted" && (
                    <Button
                      label={t.myTrips.chat}
                      variant="outline"
                      onPress={() => handleOpenChat(res.trip_id)}
                      style={styles.chatBtn}
                    />
                  )}
                  {(res.status === "pending" || res.status === "accepted") && (
                    <Button
                      label={t.myTrips.cancelReservation}
                      variant="outline"
                      onPress={() =>
                        Alert.alert(
                          t.myTrips.cancelReservationConfirm,
                          t.myTrips.cancelReservationMessage,
                          [
                            { text: t.common.cancel, style: "cancel" },
                            { text: t.common.confirm, onPress: () => handleCancelReservation(res.id) },
                          ]
                        )
                      }
                      loading={actionLoading === res.id}
                      disabled={!!actionLoading}
                      style={styles.cancelResBtn}
                    />
                  )}
                </View>
              ))
            )}
          </>
        )}
      </AutoScrollView>
    </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: spacing.xl },
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  tabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  tab: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.lg,
    marginRight: spacing.sm,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    fontWeight: typography.weights.semibold,
  },
  tabTextActive: { color: colors.primary },
  errorBox: {
    padding: spacing.md,
    backgroundColor: colors.errorLight,
  },
  errorText: { color: colors.error, fontSize: typography.sizes.sm },
  scroll: { flex: 1 },
  content: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  empty: {
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardRoute: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardDate: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardMeta: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.sm,
  },
  cardStatus: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: "capitalize",
  },
  resList: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  resTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  resRow: {
    marginBottom: spacing.sm,
  },
  resText: {
    fontSize: typography.sizes.sm,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  resActions: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  resBtn: { flex: 1 },
  chatBtn: { marginTop: spacing.sm },
  cancelBtn: { marginTop: spacing.md },
  cancelResBtn: { marginTop: spacing.md },
});
