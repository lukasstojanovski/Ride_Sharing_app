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
  Image,
  Dimensions,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useUnreadInbox } from "@/lib/UnreadInboxContext";
import { AppHeader } from "@/components/AppHeader";
import { useI18n } from "@/lib/i18n";
import { colors, typography, spacing, radius, shadows } from "@/constants/theme";

type SenderProfile = {
  first_name: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

type Message = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: SenderProfile | null;
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
  const [senderProfiles, setSenderProfiles] = useState<Record<string, SenderProfile>>({});
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const listRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

  const getSenderProfile = (m: Message): SenderProfile | null =>
    m.profiles ?? senderProfiles[m.user_id] ?? null;

  const getSenderDisplayName = (m: Message): string => {
    const p = getSenderProfile(m);
    if (!p) return "—";
    const name = (p.first_name?.trim() || p.full_name?.trim() || "").trim();
    return name || "—";
  };

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

  const inputBottomPadding = keyboardVisible ? spacing.sm : insets.bottom;

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
        .select("id, user_id, content, created_at, profiles!user_id(first_name, full_name, avatar_url)")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (mounted) {
        const list = (msgData as Message[]) || [];
        setMessages(list);
        const byUser: Record<string, SenderProfile> = {};
        for (const m of list) {
          if (m.profiles && m.user_id) byUser[m.user_id] = m.profiles;
        }
        setSenderProfiles((prev) => ({ ...prev, ...byUser }));
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
        async (payload) => {
          const newMsg = payload.new as Message;
          if (!senderProfiles[newMsg.user_id]) {
            const { data: profileRow } = await supabase
              .from("profiles")
              .select("first_name, full_name, avatar_url")
              .eq("id", newMsg.user_id)
              .single();
            if (profileRow) {
              setSenderProfiles((prev) => ({ ...prev, [newMsg.user_id]: profileRow as SenderProfile }));
            }
          }
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
        hour12: false,
      });
    } catch {
      return "";
    }
  };

  const getUtcDateString = (iso: string) => {
    try {
      return iso.slice(0, 10);
    } catch {
      return "";
    }
  };

  const formatDateLabel = (iso: string) => {
    try {
      const d = new Date(iso);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const dMidnight = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (dMidnight.getTime() === today.getTime()) return t.inbox.dateToday;
      if (dMidnight.getTime() === yesterday.getTime()) return t.inbox.dateYesterday;
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const y = d.getFullYear();
      return today.getFullYear() !== y ? `${day}/${month}/${y}` : `${day}/${month}`;
    } catch {
      return "";
    }
  };

  const getDateGroups = () => {
    const groups: { date: string; messages: Message[] }[] = [];
    let lastUtcDate = "";
    for (const m of messages) {
      const utcDate = getUtcDateString(m.created_at);
      if (!utcDate) continue;
      if (utcDate !== lastUtcDate) {
        groups.push({ date: formatDateLabel(m.created_at), messages: [m] });
        lastUtcDate = utcDate;
      } else {
        groups[groups.length - 1].messages.push(m);
      }
    }
    const oneDayMs = 24 * 60 * 60 * 1000;
    for (let i = groups.length - 1; i >= 1; i--) {
      if (groups[i].messages.length !== 1) continue;
      const prevLast = groups[i - 1].messages[groups[i - 1].messages.length - 1];
      const currTime = new Date(groups[i].messages[0].created_at).getTime();
      const prevTime = new Date(prevLast.created_at).getTime();
      if (currTime - prevTime <= oneDayMs && currTime - prevTime >= -oneDayMs) {
        groups[i - 1].messages.push(groups[i].messages[0]);
        groups.splice(i, 1);
      }
    }
    return groups;
  };

  const dateGroups = getDateGroups();

  const AVATAR_SIZE = 28;

  /** Group consecutive messages from the same user into runs */
  const getMessageRuns = (messages: Message[]): Message[][] => {
    if (messages.length === 0) return [];
    const runs: Message[][] = [];
    let run: Message[] = [messages[0]];
    for (let i = 1; i < messages.length; i++) {
      if (messages[i].user_id === messages[i - 1].user_id) {
        run.push(messages[i]);
      } else {
        runs.push(run);
        run = [messages[i]];
      }
    }
    runs.push(run);
    return runs;
  };

  const renderBubbleWithTime = (m: Message, isMe: boolean, showTime: boolean) => {
    const bubbleOnly = (
      <View style={[styles.bubble, isMe ? styles.bubbleSent : styles.bubbleReceived]}>
        <Text style={[styles.bubbleText, isMe && styles.bubbleTextSent]} selectable>
          {m.content}
        </Text>
      </View>
    );
    const timeText = showTime ? (
      <Text
        style={[styles.bubbleTime, isMe ? styles.bubbleTimeSent : styles.bubbleTimeReceived]}
        numberOfLines={1}
      >
        {formatTime(m.created_at)}
      </Text>
    ) : null;
    return (
      <View key={m.id} style={styles.singleMessageWrap}>
        {bubbleOnly}
        {timeText != null && (
          <View style={isMe ? styles.bubbleTimeWrapRight : undefined}>{timeText}</View>
        )}
      </View>
    );
  };

  const renderMessageRun = (run: Message[]) => {
    if (run.length === 0) return null;
    const isMe = run[0].user_id === currentUserId;
    const profile = getSenderProfile(run[0]);
    const displayName = getSenderDisplayName(run[0]);
    const avatarUri = profile?.avatar_url?.trim() || null;

    const avatarBlock = (
      <View style={styles.avatarWrapBottom}>
        {avatarUri ? (
          <Image source={{ uri: avatarUri }} style={[styles.avatar, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]} />
        ) : (
          <View style={[styles.avatarPlaceholder, { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 }]}>
            <Ionicons name="person" size={14} color={colors.textMuted} />
          </View>
        )}
      </View>
    );

    const bubblesColumn = (
      <View style={isMe ? styles.runBubblesColumnRight : styles.runBubblesColumnLeft}>
        {!isMe && (
          <View style={styles.senderNameRow}>
            <Text style={styles.senderName}>{displayName}</Text>
          </View>
        )}
        {run.map((m, i) => renderBubbleWithTime(m, isMe, i === run.length - 1))}
      </View>
    );

    if (isMe) {
      return (
        <View style={[styles.bubbleWrap, styles.bubbleWrapRight]}>
          <View style={styles.runRowRight}>
            {bubblesColumn}
            {avatarBlock}
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.bubbleWrap, styles.bubbleWrapLeft]}>
        <View style={styles.runRowLeft}>
          {avatarBlock}
          {bubblesColumn}
        </View>
      </View>
    );
  };

  const renderDateSeparator = (label: string) => (
    <View style={styles.dateSeparator}>
      <Text style={styles.dateSeparatorText}>{label}</Text>
    </View>
  );

  const renderSection = ({ item }: { item: { date: string; messages: Message[] } }) => {
    const runs = getMessageRuns(item.messages);
    return (
      <View>
        {renderDateSeparator(item.date)}
        {runs.slice().reverse().map((run) => (
          <View key={run[0].id}>{renderMessageRun(run)}</View>
        ))}
      </View>
    );
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

  if (!conversation) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="dark-content" backgroundColor={colors.background} />
        <View style={styles.centered}>
          <Text style={styles.errorText}>Conversation not found</Text>
          <TouchableOpacity onPress={() => router.replace("/tabs/inbox")}>
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
        keyboardVerticalOffset={0}
      >
        <View style={styles.headerWrap}>
          <AppHeader showBack onBack={() => router.replace("/tabs/inbox")} title={title} />
        </View>

        <FlatList
          ref={listRef}
          data={[...dateGroups].reverse()}
          keyExtractor={(s) => s.date + (s.messages[0]?.id ?? "")}
          renderItem={renderSection}
          contentContainerStyle={styles.listContent}
          inverted
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
  bubbleWrapLeft: {
    alignItems: "flex-start",
  },
  bubbleWrapRight: {
    alignItems: "flex-end",
  },
  bubbleRowLeft: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "85%",
  },
  bubbleRowRight: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "85%",
  },
  runRowLeft: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  runRowRight: {
    flexDirection: "row",
    alignItems: "flex-end",
    maxWidth: "85%",
  },
  runBubblesColumnLeft: {
    marginLeft: spacing.xs,
    maxWidth: "78%",
    alignItems: "flex-start",
  },
  runBubblesColumnRight: {
    marginRight: spacing.xs,
    maxWidth: "78%",
    alignItems: "flex-end",
  },
  singleMessageWrap: {
    marginBottom: 1,
  },
  avatarWrapBottom: {
    alignSelf: "flex-end",
  },
  bubbleColumn: {
    marginLeft: spacing.xs,
    maxWidth: "78%",
  },
  bubbleColumnRight: {
    marginRight: spacing.xs,
    maxWidth: "78%",
  },
  senderNameRow: {
    height: 14,
    justifyContent: "flex-end",
    marginBottom: 2,
  },
  senderName: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  avatarWrap: {
    alignSelf: "flex-end",
  },
  avatar: {
    backgroundColor: colors.surfaceAlt,
  },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    alignSelf: "flex-start",
    maxWidth: Dimensions.get("window").width * 0.75,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
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
  bubbleTimeWrapRight: {
    alignSelf: "flex-end",
  },
  bubbleTimeSent: {
    color: colors.textMuted,
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
