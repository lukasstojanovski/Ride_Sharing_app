import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUnreadNotifications } from "@/lib/UnreadNotificationsContext";
import { AppHeader } from "@/components/AppHeader";
import { LangToggle } from "@/components/AuthComponents";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

type Notification = {
  id: string;
  type: string;
  title: string;
  body: string | null;
  related_trip_id: string | null;
  related_reservation_id: string | null;
  read_at: string | null;
  created_at: string;
};

export default function NotificationsScreen() {
  const { t, toggleLanguage, language } = useI18n();
  const { refresh } = useUnreadNotifications();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setNotifications([]);
      return;
    }
    const { data, error } = await supabase
      .from("notifications")
      .select("id, type, title, body, related_trip_id, related_reservation_id, read_at, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    setNotifications((data as Notification[]) || []);
    setLoading(false);
    setRefreshing(false);
    refresh();
  };

  useEffect(() => {
    load();
  }, []);

  const handlePress = async (n: Notification) => {
    if (!n.read_at) {
      await supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .eq("id", n.id);
      refresh();
    }
    // Seat request notifications: driver goes to My Trips (accept/decline)
    if (n.type === "reservation_requested") {
      router.push("/tabs/my-trips");
      return;
    }
    // Request accepted: passenger goes to My Trips riding tab
    if (n.type === "reservation_accepted") {
      router.push("/tabs/my-trips?tab=riding");
      return;
    }
    // Reservation cancelled: go to My Trips
    if (n.type === "reservation_cancelled") {
      router.push("/tabs/my-trips");
      return;
    }
    // Other notifications: go to trip details
    if (n.related_trip_id) {
      router.push(`/trip/${n.related_trip_id}`);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      const now = new Date();
      const diff = now.getTime() - d.getTime();
      if (diff < 60_000) return language === "mk" ? "Пред момент" : "Just now";
      if (diff < 3600_000) return `${Math.floor(diff / 60_000)}m ${language === "mk" ? "пред" : "ago"}`;
      if (diff < 86400_000) return `${Math.floor(diff / 3600_000)}h ${language === "mk" ? "пред" : "ago"}`;
      return d.toLocaleDateString(undefined, { dateStyle: "short", timeStyle: "short" });
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true) || load()} />
        }
        showsVerticalScrollIndicator={false}
      >
        <AppHeader rightElement={<LangToggle language={language} onToggle={toggleLanguage} />} />

        <Text style={styles.title}>{t.notifications.title}</Text>
        {notifications.length === 0 ? (
          <Text style={styles.empty}>{t.notifications.empty}</Text>
        ) : (
          notifications.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.card, !n.read_at && styles.cardUnread]}
              onPress={() => handlePress(n)}
              activeOpacity={0.7}
              disabled={
                n.type !== "reservation_requested" &&
                n.type !== "reservation_accepted" &&
                n.type !== "reservation_cancelled" &&
                !n.related_trip_id
              }
            >
              <Text style={styles.cardTitle}>{n.title}</Text>
              {n.body ? <Text style={styles.cardBody}>{n.body}</Text> : null}
              <Text style={styles.cardDate}>{formatDate(n.created_at)}</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: typography.sizes["2xl"],
    fontWeight: typography.weights.extrabold,
    color: colors.text,
    marginBottom: spacing.xl,
    letterSpacing: -0.5,
  },
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
  cardUnread: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  cardTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cardBody: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardDate: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
