import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
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
 * ChatGPT is a deliberate exception: it's rolled out via the `ShowSignInWithChatGptButton`
 * ConfigCat flag OR'd with a manual, localStorage-only opt-in switch
 * (`LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED`, flippable via the `?siwc-enabled=1` query param —
 * see `useSiwcQueryParamOptIn`), instead of the static `dashboard_auth:sign_in_with_*` pattern.
 */
export function useEnabledIdentityProviders(): ExternalIdentityProviderConfig[] {
  const { dashboardAuthSignInWithGithub: githubEnabled } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_github',
  ])

  const [chatgptLocalStorageEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED,
    false
  )
  const chatGptConfigCatFlagEnabled = useFlag('ShowSignInWithChatGptButton')

  return useMemo(
    () =>
      [
        githubEnabled && GITHUB_IDENTITY_PROVIDER,
        (chatgptLocalStorageEnabled || chatGptConfigCatFlagEnabled) && CHATGPT_IDENTITY_PROVIDER,
      ].filter((p): p is ExternalIdentityProviderConfig => Boolean(p)),
    [githubEnabled, chatgptLocalStorageEnabled, chatGptConfigCatFlagEnabled]
  )
}
