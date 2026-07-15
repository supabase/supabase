import { useMemo } from 'react'

import type { BaseToken } from '../AccessToken.types'
import { useAccessTokensQuery } from '@/data/access-tokens/access-tokens-query'
import { useScopedAccessTokensQuery } from '@/data/scoped-access-tokens/scoped-access-token-query'

export type TokenKind = 'classic' | 'scoped'

export interface MergedAccessToken extends BaseToken {
  kind: TokenKind
}

interface UseMergedAccessTokensOptions {
  /** Whether scoped tokens should be fetched + merged (gated on the scopedPAT flag). */
  scopedEnabled?: boolean
}

/**
 * Merges classic and scoped access tokens into a single list, tagging each row with its `kind`.
 * Classic is the baseline (its loading/error state drives the list); scoped failures degrade
 * gracefully so a missing/undeployed scoped endpoint never hides classic tokens. Sorting is left to
 * the consuming list (via filterAndSortTokens), so this only merges + tags.
 */
export const useMergedAccessTokens = ({
  scopedEnabled = true,
}: UseMergedAccessTokensOptions = {}) => {
  const classic = useAccessTokensQuery()
  const scoped = useScopedAccessTokensQuery({ enabled: scopedEnabled })

  const tokens = useMemo<MergedAccessToken[]>(() => {
    const classicTokens: MergedAccessToken[] = (classic.data ?? []).map((token) => ({
      ...token,
      kind: 'classic',
    }))
    const scopedTokens: MergedAccessToken[] = (scoped.data?.tokens ?? []).map((token) => ({
      ...token,
      kind: 'scoped',
    }))
    return [...classicTokens, ...scopedTokens]
  }, [classic.data, scoped.data])

  return {
    tokens,
    // Classic drives the primary states; a scoped fetch that is still loading shouldn't block the list.
    isLoading: classic.isPending || (scopedEnabled && scoped.isPending),
    isError: classic.isError,
    error: classic.error,
    isSuccess: classic.isSuccess,
  }
}
