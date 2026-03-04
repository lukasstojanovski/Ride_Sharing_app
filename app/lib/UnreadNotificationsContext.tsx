import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

type UnreadNotificationsContextType = {
  count: number;
  refresh: () => void;
};

const UnreadNotificationsContext = createContext<UnreadNotificationsContextType>({
  count: 0,
  refresh: () => {},
});

export function UnreadNotificationsProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }
    const { count: c, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .is("read_at", null);
    if (!error) setCount(c ?? 0);
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("unread-notifications")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, fetchCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <UnreadNotificationsContext.Provider value={{ count, refresh: fetchCount }}>
      {children}
    </UnreadNotificationsContext.Provider>
  );
}

export function useUnreadNotifications() {
  return useContext(UnreadNotificationsContext);
}
