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
 * ChatGPT carries an extra rollout gate on top of its `dashboard_auth:sign_in_with_chatgpt` flag:
 * the feature flag must be enabled AND either the `ShowSignInWithChatGptButton` ConfigCat flag or a
 * manual, localStorage-only opt-in switch (`LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED`, flippable
 * via the `?siwc-enabled=1` query param — see `useSiwcQueryParamOptIn`) must be on. The feature flag
 * is the static kill switch; the OR'd pair is the progressive rollout mechanism.
 */
export function useEnabledIdentityProviders(): ExternalIdentityProviderConfig[] {
  const {
    dashboardAuthSignInWithGithub: githubEnabled,
    dashboardAuthSignInWithChatgpt: chatgptFeatureEnabled,
  } = useIsFeatureEnabled([
    'dashboard_auth:sign_in_with_github',
    'dashboard_auth:sign_in_with_chatgpt',
  ])

  const [chatgptLocalStorageEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED,
    false
  )
  const chatGptConfigCatFlagEnabled = useFlag('ShowSignInWithChatGptButton')

  const isChatGptEnabled =
    chatgptFeatureEnabled && (chatgptLocalStorageEnabled || chatGptConfigCatFlagEnabled)

  return useMemo(
    () =>
      [
        githubEnabled && GITHUB_IDENTITY_PROVIDER,
        isChatGptEnabled && CHATGPT_IDENTITY_PROVIDER,
      ].filter((p): p is ExternalIdentityProviderConfig => Boolean(p)),
    [githubEnabled, isChatGptEnabled]
  )
}
