import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient<any>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
