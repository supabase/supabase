import { createClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { marketplaceIntegrationsKeys } from './keys'
import type { Database, Tables } from './marketplace.types'

// [Joshen] There was a new way of writing queries IIRC - check with Alaister which file to reference
// https://github.com/supabase/supabase/pull/43280/changes#diff-868487dea75aac9e001894eb61232c204181d67823bedd6d2e605e49957ec5e4

const createMarketplaceClient = () => {
  const API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || ''
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MARKETPLACE_PUBLISHABLE_KEY || ''

  return createClient<Database>(API_URL, PUBLISHABLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      // @ts-expect-error
      multiTab: false,
      detectSessionInUrl: false,
      localStorage: {
        getItem: (_key: string) => undefined,
        setItem: (_key: string, _value: string) => {},
        removeItem: (_key: string) => {},
      },
    },
  })
}

// [Joshen] Something's wrong with this version of JS lib + generated types
// Ping team-dev-workflows RE this
type MarketplaceIntegration = Tables<'items'>[] & {}

async function getMarketplaceIntegrations() {
  const client = createMarketplaceClient()
  const { data, error } = await client.from('items').select('*').returns<MarketplaceIntegration>()

  if (error) handleError(error)
  return data ?? []
}

type MarketplaceIntegrationsData = Awaited<ReturnType<typeof getMarketplaceIntegrations>>
type MarketplaceIntegrationsError = ResponseError

export const useMarketplaceIntegrationsQuery = <TData = MarketplaceIntegrationsData>({
  enabled = true,
  ...options
}: UseCustomQueryOptions<MarketplaceIntegrationsData, MarketplaceIntegrationsError, TData> = {}) =>
  useQuery<MarketplaceIntegrationsData, MarketplaceIntegrationsError, TData>({
    queryKey: marketplaceIntegrationsKeys.list(),
    queryFn: () => getMarketplaceIntegrations(),
    enabled: enabled,
    staleTime: 0,
    ...options,
  })
