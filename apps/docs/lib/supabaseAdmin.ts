import 'server-only'

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import { type Database } from '~/lib/supabase'

let supabaseAdminClient: SupabaseClient<Database> | null = null

export function supabaseAdmin() {
  if (!supabaseAdminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SECRET_KEY

    if (!url || !key) {
      throw new Error('Missing required environment variables for Supabase admin client')
    }

    supabaseAdminClient = createClient(url, key)
  }

  return supabaseAdminClient
}
