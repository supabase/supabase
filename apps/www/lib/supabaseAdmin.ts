import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.LIVE_SUPABASE_SERVICE_ROLE_KEY!
)

export type SupabaseClient = typeof supabase

export default supabase
