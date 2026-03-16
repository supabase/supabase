import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VUE_APP_SUPABASE_URL as string;
const supabaseKey = process.env.VUE_APP_SUPABASE_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseKey);
