import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/**
 * Server-side Supabase clients (brief §3). Everything degrades gracefully: when
 * the env vars are unset the getters return `null`, so the app runs fully
 * without a backend (bundled seed data + local rendering) — the Supabase
 * project is an enhancement, never a hard dependency.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
const secretKey = process.env.SUPABASE_SECRET_KEY

export function isSupabaseConfigured(): boolean {
  return Boolean(url && publishableKey)
}

/**
 * Anonymous client (publishable key). Respects Row Level Security, so it can
 * only see what the public-read policies expose. Use for reads. Returns null
 * when the project isn't configured.
 */
export function getSupabase(): SupabaseClient | null {
  if (!url || !publishableKey) return null
  return createClient(url, publishableKey, { auth: { persistSession: false } })
}

/**
 * Admin client (secret key) — BYPASSES Row Level Security. Server-only, for
 * trusted writes (e.g. asset uploads) once SUPABASE_SECRET_KEY is set. Returns
 * null until then, so callers must handle the no-admin case.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  if (!url || !secretKey) return null
  return createClient(url, secretKey, { auth: { persistSession: false } })
}
