import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "./supabase";

type UnreadInboxContextType = {
  count: number;
  refresh: () => void;
};

const UnreadInboxContext = createContext<UnreadInboxContextType>({
  count: 0,
  refresh: () => {},
});

export function UnreadInboxProvider({ children }: { children: React.ReactNode }) {
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setCount(0);
      return;
    }
    const { data, error } = await supabase.rpc("get_unread_inbox_count");
    if (!error) setCount((data as number) ?? 0);
  };

  useEffect(() => {
    fetchCount();

    const channel = supabase
      .channel("unread-inbox")
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, fetchCount)
      .on("postgres_changes", { event: "*", schema: "public", table: "conversation_last_read" }, fetchCount)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <UnreadInboxContext.Provider value={{ count, refresh: fetchCount }}>
      {children}
    </UnreadInboxContext.Provider>
  );
}

export function useUnreadInbox() {
  return useContext(UnreadInboxContext);
}
