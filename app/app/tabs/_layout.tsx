import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors, typography, spacing } from "@/constants/theme";
import { useI18n } from "@/lib/i18n";
import { useUnreadNotifications } from "@/lib/UnreadNotificationsContext";
import { useUnreadInbox } from "@/lib/UnreadInboxContext";

const iconMap: Record<string, { active: string; inactive: string }> = {
  home: { active: "home", inactive: "home-outline" },
  offer: { active: "add-circle", inactive: "add-circle-outline" },
  "my-trips": { active: "car", inactive: "car-outline" },
  inbox: { active: "chatbubbles", inactive: "chatbubbles-outline" },
  notifications: { active: "notifications", inactive: "notifications-outline" },
};

export default function TabsLayout() {
  const { t } = useI18n();
  const { count: unreadCount } = useUnreadNotifications();
  const { count: unreadInboxCount } = useUnreadInbox();
  const notificationsBadge = unreadCount > 0 ? (unreadCount > 99 ? "+99" : String(unreadCount)) : undefined;
  const inboxBadge = unreadInboxCount > 0 ? (unreadInboxCount > 99 ? "+99" : String(unreadInboxCount)) : undefined;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          width: "100%",
          backgroundColor: colors.background,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 60 + spacing.sm,
          paddingTop: spacing.xs,
          paddingBottom: spacing.sm,
          paddingHorizontal: spacing.lg,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.semibold,
        },
        tabBarItemStyle: {
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarScrollEnabled: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? iconMap.home.active : iconMap.home.inactive} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: t.tabs.offer,
          unmountOnBlur: true,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? iconMap.offer.active : iconMap.offer.inactive} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-trips"
        options={{
          title: t.tabs.myTrips,
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? iconMap["my-trips"].active : iconMap["my-trips"].inactive} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inbox"
        options={{
          title: t.tabs.inbox,
          tabBarBadge: inboxBadge,
          tabBarBadgeStyle: { backgroundColor: colors.primary },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? iconMap.inbox.active : iconMap.inbox.inactive} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: t.tabs.notifications,
          tabBarBadge: notificationsBadge,
          tabBarBadgeStyle: { backgroundColor: colors.primary },
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons name={focused ? iconMap.notifications.active : iconMap.notifications.inactive} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="login-success"
        options={{
          href: null,
          title: "Welcome",
        }}
      />
    </Tabs>
  );
}
