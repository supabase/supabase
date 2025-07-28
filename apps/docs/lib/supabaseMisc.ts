import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _supabaseMisc: SupabaseClient

export function supabaseMisc() {
  if (!_supabaseMisc) {
    _supabaseMisc = createClient(
      process.env.NEXT_PUBLIC_MISC_URL!,
      process.env.NEXT_PUBLIC_MISC_ANON_KEY!
    )
  }

  return _supabaseMisc
}
