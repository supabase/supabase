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
        catalog_listings: {
          Row: {
            // add a type for the JSON structure
            categories: Category[]
            // These all come from non-nullable columns but all view columns are inferred as nullable.
            // See https://github.com/orgs/supabase/discussions/14151
            featured: boolean
            partner_name: string
            built_by: string
            slug: string
            title: string
            description: string
            content: string
            website_url: string
            documentation_url: string
            listing_logo: string
            published_in_marketplace: boolean
          }
        }
        marketplace_listings: {
          Row: {
            // add a type for the JSON structure
            categories: Category[]
            // These all come from non-nullable columns but all view columns are inferred as nullable.
            // See https://github.com/orgs/supabase/discussions/14151
            featured: boolean
            partner_name: string
            built_by: string
            slug: string
            title: string
            description: string
            content: string
            website_url: string
            documentation_url: string
            listing_logo: string
          }
        }
      }
    }
  }
>

export type CatalogListing = Database['public']['Views']['catalog_listings']['Row']
export type MarketplaceListing = Database['public']['Views']['marketplace_listings']['Row']
export type Partner = Database['public']['Views']['partners']['Row']

// 'supabase' never gets its own catalog partner page — getPartnerFromMarketplace in
// apps/www/lib/marketplaceDb.ts always 404s on this slug.
export const SUPABASE_PARTNER_SLUG = 'supabase'

// Supabase-owned listings that are remapped to appear as independent partners in the Partner
// Catalog, under a clean, partner-like URL slug (e.g. listing 'bigquery-wrapper' renders at
// /partners/catalog/bigquery). Key = listing DB slug; value = { display name, clean URL slug
// for the catalog page }. Shared so apps/www and apps/docs never drift out of sync.
export const SUPABASE_LISTING_OVERRIDES: Record<string, { name: string; slug: string }> = {
  'bigquery-wrapper': { name: 'BigQuery', slug: 'bigquery' },
  'firebase-wrapper': { name: 'Firebase', slug: 'firebase' },
  'stripe-wrapper': { name: 'Stripe', slug: 'stripe' },
  vercel: { name: 'Vercel', slug: 'vercel' },
  cyberduck: { name: 'Cyberduck', slug: 'cyberduck' },
}

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

export const fullImageUrl = (imagePath: string) => {
  const API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || ''
  return `${API_URL}${imagePath}`
}
