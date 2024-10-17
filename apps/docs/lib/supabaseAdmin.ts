import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from 'common'

let supabaseAdminClient: SupabaseClient<Database> | null = null

export function supabaseAdmin() {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    )
  }

  return supabaseAdminClient
}
