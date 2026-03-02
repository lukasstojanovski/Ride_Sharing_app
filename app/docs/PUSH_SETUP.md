# Push Notifications Setup Guide

This guide walks you through enabling push notifications so users receive alerts even when the app is closed (e.g. when a reservation is requested, accepted, or a trip is cancelled).

---

## Overview

1. **Database** — `push_tokens` table stores each user's Expo push token
2. **App** — Registers the token on login and saves it to Supabase
3. **Edge Function** — Triggered by a webhook when a notification row is inserted; fetches the token and sends to Expo Push API
4. **Webhook** — Fires on `INSERT` into `notifications`

---

## Step 1: Run the migration

Run this SQL in **Supabase Dashboard → SQL Editor**:

```sql
-- Contents of app/supabase/migrations/005_push_tokens.sql
```

Or open `app/supabase/migrations/005_push_tokens.sql`, copy its contents into the SQL editor, and execute. This creates the `push_tokens` table.

---

## Step 2: Install app dependencies

From the `app` folder:

```bash
cd app
npm install
# or: npx expo install expo-notifications expo-device
```

---

## Step 3: Get your EAS project ID

1. Go to [expo.dev](https://expo.dev) and sign in
2. Create or select your project
3. Open **Project Settings**
4. Copy the **Project ID** (UUID)

Add it to your `app/.env`:

```
EXPO_PUBLIC_EAS_PROJECT_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

## Step 4: Deploy the Edge Function

1. Install Supabase CLI if needed: `npm install -g supabase`
2. Log in: `supabase login`
3. From the **project root** (Ride_Sharing_app): `supabase link --project-ref YOUR_PROJECT_REF`  
   (Get `YOUR_PROJECT_REF` from your Supabase project URL, e.g. `xxxxx` in `https://xxxxx.supabase.co`)
4. Deploy the function:

```bash
supabase functions deploy send-push-notification
```

The function URL will be: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-push-notification`

---

## Step 5: Create the database webhook

1. Open **Supabase Dashboard → Database → Webhooks**
2. Click **Create a new webhook**
3. Configure:
   - **Name:** `on_notification_insert`
   - **Table:** `public.notifications`
   - **Events:** Check **Insert**
   - **Type:** **Supabase Edge Function**
   - **Edge Function:** `send-push-notification`
4. Save

---

## Step 6: Set up credentials (for production builds)

Push notifications require native credentials. Use [EAS Build](https://docs.expo.dev/build/introduction/) to manage them.

### Android (FCM)

1. Add FCM V1 credentials: [Expo docs – FCM credentials](https://docs.expo.dev/push-notifications/fcm-credentials)
2. Run `eas credentials` and add the FCM credentials to your project

### iOS (APNs)

1. Run `eas credentials` for iOS
2. Configure push notification keys and provisioning profiles

### Create a development build

```bash
cd app
eas build --profile development --platform android
# or: eas build --profile development --platform ios
```

Install the built app on a **physical device** (push does not work on simulators/emulators).

---

## Step 7: Test

1. Build and install the app on a physical device (development build)
2. Log in
3. The app will register the push token and save it to `push_tokens`
4. Trigger a notification (e.g. request seats on a trip as another user, or accept/decline a reservation)
5. The webhook should fire → Edge Function runs → Expo sends the push
6. You should receive the notification even when the app is in the background or closed

---

## Troubleshooting

| Issue | Check |
|-------|--------|
| No push received | Verify the user has a row in `push_tokens` and the token looks correct (Expo format) |
| "No push token for user" | User must log in on a physical device; token registration runs on login |
| "projectId not found" | Set `EXPO_PUBLIC_EAS_PROJECT_ID` in `app/.env` |
| Webhook not firing | Confirm webhook is on `public.notifications` and event is **Insert** |
| Expo Push API errors | Check [Expo status](https://status.expo.dev); ensure credentials (FCM/APNs) are set up for the build |

---

## File reference

| File | Purpose |
|------|---------|
| `app/supabase/migrations/005_push_tokens.sql` | `push_tokens` table |
| `supabase/functions/send-push-notification/index.ts` | Edge Function that sends to Expo |
| `app/lib/registerPushToken.ts` | Registers and saves token on login |
| `app/app/_layout.tsx` | Calls `registerPushToken` when user is logged in |
