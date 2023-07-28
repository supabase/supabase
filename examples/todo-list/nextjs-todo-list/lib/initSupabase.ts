import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_IECHOR_URL ?? '',
  process.env.NEXT_PUBLIC_IECHOR_ANON_KEY ?? ''
)
