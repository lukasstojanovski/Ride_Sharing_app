import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { AutoFlatList } from "@/components/AutoFlatList";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius, shadows, MAX_SEATS } from "@/constants/theme";

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
  const { t } = useI18n();
  const { from, to, date, seats } = useLocalSearchParams<{
    from: string;
    to: string;
    date: string;
    seats: string;
  }>();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const seatsNum = Math.min(MAX_SEATS, Math.max(1, parseInt(seats || "1", 10) || 1));
  const dateStr = (date || "").trim();
  const startOfDay = dateStr ? `${dateStr}T00:00:00.000Z` : "";
  const endOfDay = dateStr ? `${dateStr}T23:59:59.999Z` : "";

  const fetchTrips = useCallback(() => {
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

  useEffect(() => {
    fetchTrips();
  }, [fetchTrips]);

  useEffect(() => {
    const channel = supabase
      .channel("search-results-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "trips" }, fetchTrips)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchTrips]);

  const formatTime = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
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
          <Text style={styles.centeredText}>{t.search.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>{t.search.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <View style={styles.headerWrap}>
        <AppHeader
          showBack
          onBack={() => router.back()}
          title={`${from} → ${to}`}
        />
      </View>

      {trips.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>{t.search.noTrips}</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>{t.search.changeSearch}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <AutoFlatList
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
                  {item.seats_available} {t.search.seatsLeft}
                </Text>
                <Text style={styles.cardPrice}>{item.price} den</Text>
              </View>
              <Text style={styles.cardDriver}>
                {t.search.driver}: {item.profiles?.full_name ?? "—"}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  headerWrap: { paddingHorizontal: spacing.xl },
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
