import { Tabs } from "expo-router";
import { colors } from "@/constants/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="offer" options={{ title: "Offer" }} />
      <Tabs.Screen name="my-trips" options={{ title: "My Trips" }} />
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
