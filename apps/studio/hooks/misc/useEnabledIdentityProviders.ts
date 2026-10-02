import { useMemo } from 'react'

import { useIsFeatureEnabled } from './useIsFeatureEnabled'
import {
  CHATGPT_IDENTITY_PROVIDER,
  GITHUB_IDENTITY_PROVIDER,
  type ExternalIdentityProviderConfig,
} from '@/lib/external-identity-providers'

/**
 * Returns the statically-declared identity providers whose feature flag is currently enabled.
 * To add a provider: declare its config in `lib/external-identity-providers.ts`, add a
 * `dashboard_auth:sign_in_with_*` flag, and gate it here.
 */
export function useEnabledIdentityProviders(): ExternalIdentityProviderConfig[] {
  const {
    dashboardAuthSignInWithGithub: githubEnabled,
    dashboardAuthSignInWithChatgpt: chatgptEnabled,
  } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_github',
    'dashboard_auth:sign_in_with_chatgpt',
  ])

  return useMemo(
    () =>
      [
        githubEnabled && GITHUB_IDENTITY_PROVIDER,
        chatgptEnabled && CHATGPT_IDENTITY_PROVIDER,
      ].filter((p): p is ExternalIdentityProviderConfig => Boolean(p)),
    [githubEnabled, chatgptEnabled]
  )
}
