import { LOCAL_STORAGE_KEYS } from 'common'
import { useMemo } from 'react'

import { useIsFeatureEnabled } from './useIsFeatureEnabled'
import { useLocalStorageQuery } from './useLocalStorage'
import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'

/**
 * Returns the statically-declared identity providers whose feature flag is currently enabled.
 * To add a provider: declare its config in `lib/external-identity-providers.ts`, add a
 * `dashboard_auth:sign_in_with_*` flag, and gate it here.
 *
 * ChatGPT is a deliberate exception: it's also gated behind a manual, localStorage-only rollout
 * switch (`LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED`) on top of its feature flag, since it's WIP.
 */
export function useEnabledIdentityProviders(): ExternalIdentityProviderConfig[] {
  const { dashboardAuthSignInWithGithub: githubEnabled } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_github',
  ])

  const { dashboardAuthSignInWithChatgpt: chatgptEnabled } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_chatgpt',
  ])
  const [chatgptLocalStorageEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED,
    false
  )

  return useMemo(
    () =>
      [
        githubEnabled && GITHUB_IDENTITY_PROVIDER,
        chatgptEnabled && chatgptLocalStorageEnabled && CHATGPT_IDENTITY_PROVIDER,
      ].filter((p): p is ExternalIdentityProviderConfig => Boolean(p)),
    [githubEnabled, chatgptEnabled, chatgptLocalStorageEnabled]
  )
}
