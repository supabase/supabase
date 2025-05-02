import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from 'common'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

let __supabase: SupabaseClient<Database>

export function supabase() {
  if (!__supabase) {
    __supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
  }
  return __supabase
}
