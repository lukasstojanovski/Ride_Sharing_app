// Edge Function: sends Expo push notification when a row is inserted into notifications.
// Called by Database Webhook on INSERT into public.notifications.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRecord {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  related_trip_id: string | null;
  related_reservation_id: string | null;
}

interface WebhookPayload {
  type: "INSERT";
  table: string;
  schema: string;
  record: NotificationRecord;
  old_record: null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const payload = (await req.json()) as WebhookPayload;
    if (payload.type !== "INSERT" || payload.table !== "notifications") {
      return new Response(JSON.stringify({ ok: false, message: "Expected INSERT on notifications" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, type, title, body, related_trip_id, related_reservation_id } = payload.record;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: tokenRow, error: tokenError } = await supabase
      .from("push_tokens")
      .select("token")
      .eq("user_id", user_id)
      .single();

    if (tokenError || !tokenRow?.token) {
      return new Response(
        JSON.stringify({ ok: false, message: "No push token for user" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const expoRes = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to: tokenRow.token,
        title: title || "RideShare",
        body: body || "",
        sound: "default",
        data: {
          type: type || "",
          related_trip_id: related_trip_id || "",
          related_reservation_id: related_reservation_id || "",
        },
      }),
    });

    if (!expoRes.ok) {
      const errText = await expoRes.text();
      throw new Error(`Expo push failed: ${expoRes.status} ${errText}`);
    }

    return new Response(
      JSON.stringify({ ok: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ ok: false, message: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
