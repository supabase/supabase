import { createBrowserClient } from '@supabase/ssr'

export const createClient = () =>
  createBrowserClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_PUBLISHABLE_KEY
  )
