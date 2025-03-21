import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!)
}
