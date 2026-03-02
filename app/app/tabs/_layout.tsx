import { Tabs } from "expo-router";
import { colors, typography } from "@/constants/theme";
import { useI18n } from "@/lib/i18n";

export default function TabsLayout() {
  const { t } = useI18n();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: {
          fontSize: typography.sizes.xs,
          fontWeight: typography.weights.semibold,
        },
      }}
    >
      <Tabs.Screen name="home" options={{ title: t.tabs.home }} />
      <Tabs.Screen name="offer" options={{ title: t.tabs.offer }} />
      <Tabs.Screen name="my-trips" options={{ title: t.tabs.myTrips }} />
      <Tabs.Screen name="notifications" options={{ title: t.tabs.notifications }} />
      <Tabs.Screen
        name="login-success"
        options={{
          title: "Welcome",
          tabBarStyle: { display: "none" },
          tabBarButton: () => null,
        }}
      />
    </Tabs>
  );
}
