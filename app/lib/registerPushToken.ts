import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Registers for push notifications and saves the Expo push token to Supabase.
 * Call this when the user is logged in. Requires a physical device (not emulator).
 * projectId must be set in app.config.js extra.eas.projectId for push to work.
 */
export async function registerPushToken(userId: string): Promise<boolean> {
  if (!Device.isDevice) return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return false;

  const projectId =
    Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
  if (!projectId) {
    console.warn("[Push] projectId not found. Add extra.eas.projectId to app.config.js.");
    return false;
  }

  try {
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    const token = data;
    if (!token) return false;

    const { error } = await supabase
      .from("push_tokens")
      .upsert(
        {
          user_id: userId,
          token,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );

    if (error) {
      console.warn("[Push] Failed to save token:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.warn("[Push] Failed to get token:", e);
    return false;
  }
}
