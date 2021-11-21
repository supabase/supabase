import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import { Platform } from "react-native";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";
import "react-native-url-polyfill/auto";

let client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  localStorage: AsyncStorage,
  detectSessionInUrl: Platform.OS === "web",
});

export default client;
