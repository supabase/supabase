import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useQuery } from '@tanstack/react-query'
import { handleError } from 'data/fetchers'
import type { ResponseError, UseCustomQueryOptions } from 'types'

import { marketplaceIntegrationsKeys } from './keys'

const createMarketplaceClient = (): SupabaseClient => {
  const API_URL = process.env.NEXT_PUBLIC_MARKETPLACE_API_URL || ''
  const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MARKETPLACE_PUBLISHABLE_KEY || ''

  return createClient(API_URL, PUBLISHABLE_KEY, {
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

async function getMarketplaceIntegrations() {
  const client = createMarketplaceClient()
  const { data, error } = await client.from('items').select('*')

  if (error) handleError(error)
  return data
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
