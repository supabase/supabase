import AsyncStorage from '@react-native-async-storage/async-storage';
import {createClient} from '@supabase/supabase-js';
import {SUPABASE_ANON_KEY, SUPABASE_URL} from '../config';

let client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  localStorage: AsyncStorage,
  detectSessionInUrl: false,
});

export default client;
