import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { supabase } from "@/lib/supabase";
import { AutoScrollView } from "@/components/AutoScrollView";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius } from "@/constants/theme";

type Conversation = {
  id: string;
  trip_id: string;
  from_city: string;
  to_city: string;
  departure_time: string;
  last_message: string | null;
  last_message_at: string | null;
  has_unread: boolean;
};

export default function InboxScreen() {
  const { t, language } = useI18n();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      setConversations([]);
      return;
    }
    const { data, error } = await supabase.rpc("get_my_conversations");
    setConversations((data as Conversation[]) || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel("inbox-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_last_read" }, load)
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const formatLastMessageTime = (iso: string | null) => {
    if (!iso) return "";
    try {
      const d = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - d.getTime();
      if (diffMs < 60_000) return `${Math.max(0, Math.floor(diffMs / 1000))}s`;
      if (diffMs < 3600_000) return `${Math.floor(diffMs / 60_000)}m`;
      if (diffMs < 86400_000) return `${Math.floor(diffMs / 3600_000)}h`;
      const days = Math.floor(diffMs / 86400_000);
      if (days < 7) return `${days}d`;
      if (days < 30) return `${Math.floor(days / 7)}w`;
      if (days < 365) return `${Math.floor(days / 30)}m`;
      return `${Math.floor(days / 365)}y`;
    } catch {
      return "";
    }
  };

  const formatDeparture = (iso: string) => {
    try {
      const d = new Date(iso);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      return `${day}/${month}/${d.getFullYear()}`;
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
      <AutoScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true) || load()} />
        }
        showsVerticalScrollIndicator={false}
        scrollEnabled
        bounces
        alwaysBounceVertical
      >
        <AppHeader />

        <Text style={styles.title}>{t.inbox.title}</Text>
        {conversations.length === 0 ? (
          <Text style={styles.empty}>{t.inbox.empty}</Text>
        ) : (
          conversations.map((conv) => (
            <TouchableOpacity
              key={conv.id}
              style={styles.card}
              onPress={() => router.push(`/chat/${conv.id}`)}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardRoute}>
                  {conv.from_city} → {conv.to_city}
                </Text>
                {conv.has_unread && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.cardDate}>{formatDeparture(conv.departure_time)}</Text>
              {conv.last_message ? (
                <Text style={styles.cardPreview} numberOfLines={1}>
                  {conv.last_message}
                </Text>
              ) : null}
              {(conv.last_message_at || conv.last_message) && (
                <Text style={styles.cardTime}>
                  {formatLastMessageTime(conv.last_message_at)}
                </Text>
              )}
            </TouchableOpacity>
          ))
        )}
      </AutoScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: spacing["3xl"] },
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
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xs,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
  cardRoute: {
    flex: 1,
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: colors.text,
  },
  cardDate: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  cardPreview: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  cardTime: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});
