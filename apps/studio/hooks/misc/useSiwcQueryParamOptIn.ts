import { LOCAL_STORAGE_KEYS } from 'common'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useLocalStorageQuery } from './useLocalStorage'

/**
 * Lets a shareable link (e.g. `/sign-in?siwc-enabled=1`) flip on the manual ChatGPT sign-in
 * rollout switch (`LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED`, read by
 * `useEnabledIdentityProviders`) for this browser, instead of requiring a devtools localStorage
 * edit. Only ever meaningful on `/sign-in` and `/sign-up`, where this param would be linked to.
 *
 * Only the exact string `'1'` opts in; the flag is never cleared based on the param's absence, so
 * it persists once set.
 */
export function useSiwcQueryParamOptIn() {
  const router = useRouter()
  const [, setChatgptLocalStorageEnabled] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.SIGN_IN_CHATGPT_ENABLED,
    false
  )

  const siwcParam = router.isReady ? router.query['siwc-enabled'] : undefined

  useEffect(() => {
    if (siwcParam === '1') {
      setChatgptLocalStorageEnabled(true)
    }
  }, [siwcParam, setChatgptLocalStorageEnabled])
}
