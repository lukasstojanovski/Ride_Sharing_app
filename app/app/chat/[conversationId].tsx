import { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  StatusBar,
  Pressable,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUnreadInbox } from "@/lib/UnreadInboxContext";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius, shadows } from "@/constants/theme";

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
};

type ConversationWithTrip = {
  id: string;
  trip_id: string;
  trips: { from_city: string; to_city: string } | null;
};

export default function ChatScreen() {
  const { t } = useI18n();
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const { refresh } = useUnreadInbox();
  const [conversation, setConversation] = useState<ConversationWithTrip | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () =>
      setKeyboardVisible(true)
    );
    const hide = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () =>
      setKeyboardVisible(false)
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const inputBottomPadding = keyboardVisible ? 0 : insets.bottom;

  const title = conversation?.trips
    ? `${conversation.trips.from_city} → ${conversation.trips.to_city}`
    : "Chat";

  useEffect(() => {
    if (!conversationId) {
      setLoading(false);
      return;
    }

    let mounted = true;

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      setCurrentUserId(user.id);

      const { data: convData, error: convError } = await supabase
        .from("conversations")
        .select("id, trip_id, trips(from_city, to_city)")
        .eq("id", conversationId)
        .single();

      if (!mounted) return;
      if (convError || !convData) {
        setLoading(false);
        return;
      }
      setConversation(convData as ConversationWithTrip);

      const { data: msgData } = await supabase
        .from("messages")
        .select("id, user_id, content, created_at")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (mounted) {
        setMessages((msgData as Message[]) || []);
        await supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId });
        refresh();
      }
      setLoading(false);
    })();

    return () => {
      mounted = false;
    };
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
          if (conversationId) {
            supabase.rpc("mark_conversation_read", { p_conversation_id: conversationId }).then(() => refresh());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || !conversationId || !currentUserId || sending) return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      conversation_id: conversationId,
      user_id: currentUserId,
      content: trimmed,
    });
    setSending(false);
    if (error) return;
    setInput("");
  };

  const formatTime = (iso: string) => {
    try {
      return new Date(iso).toLocaleTimeString(undefined, {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  };

  const formatDateLabel = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (d.toDateString() === today.toDateString()) return t.inbox.dateToday;
      if (d.toDateString() === yesterday.toDateString()) return t.inbox.dateYesterday;
      return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: d.getFullYear() !== today.getFullYear() ? "numeric" : undefined });
    } catch {
      return "";
    }
  };

  const getDateGroups = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let lastDate = "";
    for (const m of messages) {
      const d = new Date(m.created_at).toDateString();
      if (d !== lastDate) {
        groups.push({ date: formatDateLabel(m.created_at), messages: [m] });
        lastDate = d;
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    }
    return groups;
  };

  const dateGroups = getDateGroups();

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.user_id === currentUserId;
    return (
      <View style={[styles.bubbleWrap, isMe && styles.bubbleWrapRight]}>
        <View style={[styles.bubble, isMe ? styles.bubbleSent : styles.bubbleReceived]}>
          <Text style={[styles.bubbleText, isMe && styles.bubbleTextSent]} selectable>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, isMe ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  const renderDateSeparator = (label: string) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateSeparatorText}>{label}</Text>
    </View>
  );

  const renderSection = ({ item }: { item: { date: string; messages: Message[] } }) => (
    <View>
      {renderDateSeparator(item.date)}
      {item.messages.map((m) => (
        <View key={m.id}>{renderMessage({ item: m })}</View>
      ))}
    </View>
  );

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

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Conversation not found</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.link}>{t.trip.goBack}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 220 : 0}
      >
        <View style={styles.headerWrap}>
          <AppHeader showBack onBack={() => router.back()} title={title} />
        </View>

        <FlatList
          ref={listRef}
          data={dateGroups}
          keyExtractor={(s) => s.date + (s.messages[0]?.id ?? "")}
          renderItem={renderSection}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Ionicons name="chatbubbles-outline" size={48} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>{t.inbox.messagesEmpty}</Text>
              <Text style={styles.emptySubtext}>{t.inbox.startConversation}</Text>
            </View>
          }
        />

        <View style={[styles.inputRow, { paddingBottom: inputBottomPadding }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder={t.inbox.messagePlaceholder}
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              (!input.trim() || sending) && styles.sendBtnDisabled,
              pressed && styles.sendBtnPressed,
            ]}
            onPress={handleSend}
            disabled={!input.trim() || sending}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  container: { flex: 1 },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  errorText: { color: colors.textSecondary, marginBottom: spacing.md },
  link: { fontSize: typography.sizes.base, color: colors.primary, fontWeight: typography.weights.semibold },
  headerWrap: {
    paddingHorizontal: spacing.xl,
  },
  listContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    flexGrow: 1,
    backgroundColor: colors.surface,
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: spacing["4xl"],
  },
  emptyIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: "center",
  },
  dateSeparator: {
    alignSelf: "center",
    marginVertical: spacing.lg,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.full,
  },
  dateSeparatorText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    fontWeight: typography.weights.medium,
  },
  bubbleWrap: {
    marginBottom: spacing.sm,
    alignItems: "flex-start",
  },
  bubbleWrapRight: {
    alignItems: "flex-end",
  },
  bubble: {
    maxWidth: "78%",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.lg,
  },
  bubbleSent: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
    ...shadows.sm,
  },
  bubbleReceived: {
    backgroundColor: colors.background,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  bubbleText: {
    fontSize: typography.sizes.base,
    color: colors.text,
    lineHeight: 22,
  },
  bubbleTextSent: {
    color: colors.textInverse,
  },
  bubbleTime: {
    fontSize: typography.sizes.xs,
    marginTop: spacing.xs,
  },
  bubbleTimeSent: {
    color: "rgba(255,255,255,0.85)",
  },
  bubbleTimeReceived: {
    color: colors.textMuted,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 22,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    paddingTop: spacing.sm + 2,
    fontSize: typography.sizes.base,
    color: colors.text,
    maxHeight: 120,
    marginRight: spacing.sm,
    backgroundColor: "transparent",
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnPressed: {
    opacity: 0.85,
  },
  sendBtnDisabled: {
    opacity: 0.4,
  },
});
