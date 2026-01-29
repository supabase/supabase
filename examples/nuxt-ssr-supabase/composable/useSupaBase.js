// composables/useSupabase.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY

export const useSupabase = () => {
  return createClient(supabaseUrl, supabaseKey)
}
