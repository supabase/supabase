import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the secret key.
 * For use in server-side API routes only.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.LIVE_SUPABASE_SECRET_KEY!)
}
