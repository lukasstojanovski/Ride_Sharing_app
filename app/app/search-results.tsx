import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { colors, typography, spacing, radius, shadows } from "@/constants/theme";

type TripRow = {
  id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  seats_available: number;
  seats_total: number;
  price: number;
  profiles: { full_name: string | null } | null;
};

export default function SearchResultsScreen() {
  const { from, to, date, seats } = useLocalSearchParams<{
    from: string;
    to: string;
    date: string;
    seats: string;
  }>();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seatsNum = Math.max(1, parseInt(seats || "1", 10) || 1);
  const dateStr = (date || "").trim();
  const startOfDay = dateStr ? `${dateStr}T00:00:00.000Z` : "";
  const endOfDay = dateStr ? `${dateStr}T23:59:59.999Z` : "";

  useEffect(() => {
    if (!from || !to || !dateStr) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from("trips")
      .select("id, from_city, to_city, departure_time, seats_available, seats_total, price, profiles!creator_id(full_name)")
      .eq("status", "active")
      .ilike("from_city", from)
      .ilike("to_city", to)
      .gte("departure_time", startOfDay)
      .lte("departure_time", endOfDay)
      .gte("seats_available", seatsNum)
      .order("departure_time", { ascending: true })
      .then(({ data, error: e }) => {
        setLoading(false);
        if (e) {
          setError(e.message);
          setTrips([]);
          return;
        }
        setTrips((data as TripRow[]) || []);
      });
  }, [from, to, dateStr, startOfDay, endOfDay, seatsNum]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.centeredText}>Loading trips…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>
          {from} → {to}
        </Text>
      </View>

      {trips.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>No trips found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>Change search</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/trip/${item.id}`)}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTime}>
                {formatTime(item.departure_time)}
              </Text>
              <Text style={styles.cardRoute}>
                {item.from_city} → {item.to_city}
              </Text>
              <View style={styles.cardRow}>
                <Text style={styles.cardMeta}>
                  {item.seats_available} seat(s) left
                </Text>
                <Text style={styles.cardPrice}>{item.price} den</Text>
              </View>
              <Text style={styles.cardDriver}>
                Driver: {item.profiles?.full_name ?? "—"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  centeredText: { marginTop: spacing.md, color: colors.textSecondary },
  errorText: { color: colors.error, textAlign: "center", marginBottom: spacing.md },
  link: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  back: {
    fontSize: typography.sizes.base,
    color: colors.primary,
    fontWeight: typography.weights.semibold,
  },
  title: {
    flex: 1,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
  },
  list: { padding: spacing.xl, paddingBottom: spacing["3xl"] },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  cardTime: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardRoute: {
    fontSize: typography.sizes.base,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  cardMeta: { fontSize: typography.sizes.sm, color: colors.textMuted },
  cardPrice: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  cardDriver: { fontSize: typography.sizes.sm, color: colors.textMuted },
  empty: {
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
});
