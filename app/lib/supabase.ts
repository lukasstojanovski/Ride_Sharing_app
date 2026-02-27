import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Use EAS/extra env in production: set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ??
  "https://rweejuvybrjpotcsvjii.supabase.co";
const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3ZWVqdXZ5YnJqcG90Y3N2amlpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE3OTQxNzAsImV4cCI6MjA4NzM3MDE3MH0._bm-M-RhwrcnbfIXV_MmpNwu6jLoz6xUyDBwtCJujsc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
