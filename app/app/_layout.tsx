import { useEffect, useState } from "react";
import { Slot, useRouter, useSegments } from "expo-router";
import { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { I18nProvider } from "../lib/i18n";

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

  // Show nothing while checking session (add a splash screen here if you want)
  if (session === undefined) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <I18nProvider>
      <AuthGate />
    </I18nProvider>
  );
}
