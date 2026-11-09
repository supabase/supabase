import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const TABLE_NAME = 'docs_search_v2'
export const SEARCH_FUNCTION = 'docs_search_v2'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local.`)
  }
  return value
}

/** Server-side client built from NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in .env.local. */
export function createSupabaseClient(): SupabaseClient {
  const url = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const secretKey = requireEnv('SUPABASE_SECRET_KEY')

  return createClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}
