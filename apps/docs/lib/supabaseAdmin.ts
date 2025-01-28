import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from 'common'

let supabaseAdminClient: SupabaseClient<Database> | null = null

export function supabaseAdmin() {
  if (!supabaseAdminClient) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL is required')
    }
    if (!process.env.SUPABASE_SECRET_KEY) {
      throw new Error('SUPABASE_SECRET_KEY is required')
    }
    supabaseAdminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SECRET_KEY
    )
  }

  return supabaseAdminClient
}
