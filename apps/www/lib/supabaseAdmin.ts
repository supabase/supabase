import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types'

const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.LIVE_SUPABASE_COM_SERVICE_ROLE_KEY!
)

export type SupabaseClient = typeof supabaseAdmin

export default supabaseAdmin
