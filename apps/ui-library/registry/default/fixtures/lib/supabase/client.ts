import { createBrowserClient } from '@supabase/ssr'

import { Database } from '../../database.types'

// This client is meant to be used for demo purposes only. It has types from the Supabase project in the ui-library app.
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY!
  )
}
