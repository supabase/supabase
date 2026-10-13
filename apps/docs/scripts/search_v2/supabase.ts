import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const TABLE_NAME = 'docs_sections'
export const SEARCH_FUNCTION = 'search_docs'

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}. Set it in .env.local.`)
  }
  return value
}

/** Server-side client built from SEARCH_V2_SUPABASE_PROJECT_ID + SEARCH_V2_SUPABASE_SECRET_KEY in .env.local. */
export function createSupabaseClient(): SupabaseClient {
  const projectId = requireEnv('SEARCH_V2_SUPABASE_PROJECT_ID')
  const secretKey = requireEnv('SEARCH_V2_SUPABASE_SECRET_KEY')

  return createClient(`https://${projectId}.supabase.co`, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}
