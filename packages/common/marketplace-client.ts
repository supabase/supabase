import { createClient } from '@supabase/supabase-js'

import type { Database } from './marketplace.types'

export const createMarketplaceClient = () => {
  const API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || ''
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MARKETPLACE_PUBLISHABLE_KEY || ''

  return createClient<Database>(API_URL, PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storage: {
        getItem: (_key: string) => null,
        setItem: (_key: string, _value: string) => {},
        removeItem: (_key: string) => {},
      },
    },
  })
}
