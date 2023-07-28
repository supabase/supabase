import { createClient } from '@supabase/supabase-js'
import { Database } from './schema'

const supabaseUrl = import.meta.env.VITE_IECHOR_URL
const supabaseAnonKey = import.meta.env.VITE_IECHOR_ANON_KEY

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
