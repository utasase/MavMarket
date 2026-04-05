import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// If credentials are missing the app runs on mock data. All lib functions will
// throw and components catch those errors gracefully, keeping mock data in place.
const PLACEHOLDER_URL = "https://placeholder.supabase.co";
const PLACEHOLDER_KEY = "placeholder-anon-key";

export const supabaseConfigured =
  Boolean(supabaseUrl) &&
  supabaseUrl !== PLACEHOLDER_URL &&
  Boolean(supabaseAnonKey) &&
  supabaseAnonKey !== PLACEHOLDER_KEY;

export const supabase = createClient(
  supabaseUrl ?? PLACEHOLDER_URL,
  supabaseAnonKey ?? PLACEHOLDER_KEY,
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);
