import { createClient } from '@supabase/supabase-js'
import { MergeDeep } from 'type-fest'

import type { Database as DatabaseGenerated } from './marketplace.types'

export type Category = {
  id: string
  name: string
  slug: string
  description: string
}

export type Database = MergeDeep<
  DatabaseGenerated,
  {
    public: {
      Views: {
        listings: {
          Row: {
            categories: Category[]
          }
        }
      }
    }
  }
>

export type Listing = Database['public']['Views']['listings']['Row']

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
