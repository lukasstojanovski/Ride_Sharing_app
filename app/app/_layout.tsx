import { useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import { Slot, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { I18nProvider } from "../lib/i18n";
import { UnreadNotificationsProvider } from "../lib/UnreadNotificationsContext";
import { UnreadInboxProvider } from "../lib/UnreadInboxContext";
import { registerPushToken } from "../lib/registerPushToken";

function AuthGate() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) =>
      setSession(session),
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined) return; // Still loading, do nothing

    const inAuthGroup = segments[0] === "auth" || segments[0] === "login";
    const isAddPhoneFromApp = segments[0] === "auth" && segments[1] === "add-phone";

    if (!session && !inAuthGroup) {
      // Not logged in → send to login
      router.replace("/login");
    } else if (session && inAuthGroup && !isAddPhoneFromApp) {
      // Logged in but on auth screen (except add-phone when adding phone from app) → send to main app
      router.replace("/tabs/home");
    }
  }, [session, segments, router]);

  // Register push token when user is logged in
  useEffect(() => {
    if (session?.user?.id) {
      registerPushToken(session.user.id);
    }
  }, [session?.user?.id]);

  // Handle notification tap: navigate based on type
  useEffect(() => {
    if (!session) return;
    const navigateFromNotification = (data: { type?: string } | undefined) => {
      if (data?.type === "reservation_accepted") {
        router.push("/tabs/my-trips?tab=riding");
      } else if (data?.type === "reservation_cancelled") {
        router.push("/tabs/my-trips");
      }
    };
    // Handle tap when app was in background (listener fires)
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string } | undefined;
      navigateFromNotification(data);
    });
    // Handle tap when app was closed (check on mount)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const data = response.notification.request.content.data as { type?: string } | undefined;
        navigateFromNotification(data);
      }
    });
    return () => sub.remove();
  }, [router, session]);

  // Show nothing while checking session (add a splash screen here if you want)
  if (session === undefined) return null;

  return (
    <UnreadNotificationsProvider>
      <UnreadInboxProvider>
        <Slot />
      </UnreadInboxProvider>
    </UnreadNotificationsProvider>
  );
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthGate />
    </I18nProvider>
  );
}
