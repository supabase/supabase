import { IS_PLATFORM } from './constants'
import { User } from '@supabase/gotrue-js'
import { gotrueClient } from 'common'
import { getFlags } from './configcat'
import { getNavigatorLockFeatureFlagThreshold, setNavigatorLockEnabled } from './local-storage'

// The first time this file is imported, ConfigCat will be asked for all
// available feature flags. The client that this is running in will have
// determined and saved a random number [0, 100) under
// `supabase.dashboard.ff.threshold.navigatorLock`. If there is a number-valued
// feature flag `navigatorLockThreshold`, the
// `supabase.dashboard.auth.navigatorLock.enabled` localStorage key will be set
// to true if the value chosen by the browser is <= the value in the feature
// flag.On the _following_ refresh of the page, `packages/common/gotrue.ts`
// will read this value and enable the GoTrueClient navigatorLock.
// ConfigCat does not have a native way to do this, as percent-based rollouts
// are only available when ConfigCat has a user ID, and not without one, which
// can be the case here (GoTrue is used when not authenticated too).
async function determineNavigatorLockFeatureFlag() {
  const flags = await getFlags()
  const value = flags.find((flag) => flag.settingKey === 'navigatorLockThreshold')?.settingValue

  if (typeof value === 'number' && value > 0) {
    const threshold = getNavigatorLockFeatureFlagThreshold()

    if (typeof threshold === 'number') {
      setNavigatorLockEnabled(threshold <= value)
    } else {
      setNavigatorLockEnabled(false)
    }
  } else {
    setNavigatorLockEnabled(false)
  }
}

export { STORAGE_KEY } from 'common'

export const auth = gotrueClient

export const getAuthUser = async (token: String): Promise<any> => {
  try {
    const {
      data: { user },
      error,
    } = await auth.getUser(token.replace('Bearer ', ''))
    if (error) throw error

    return { user, error: null }
  } catch (err) {
    console.error(err)
    return { user: null, error: err }
  }
}

export const getAuth0Id = (provider: String, providerId: String): String => {
  return `${provider}|${providerId}`
}

export const getIdentity = (gotrueUser: User) => {
  try {
    if (gotrueUser !== undefined && gotrueUser.identities !== undefined) {
      return { identity: gotrueUser.identities[0], error: null }
    }
    throw 'Missing identity'
  } catch (err) {
    return { identity: null, error: err }
  }
}

// NOTE: do not use any imports in this function as it is used standalone in the documents head
// [Joshen] Potentially can remove after full move over to /dashboard
export const getReturnToPath = (fallback = '/projects') => {
  const searchParams = new URLSearchParams(location.search)

  // [Joshen] Remove base path value ("/dashboard") from returnTo
  // because we're having this in the document's head, we won't have access
  // to process.env, hardcoding the value as a workaround
  const returnTo = (searchParams.get('returnTo') ?? fallback).replace('/dashboard', '')

  searchParams.delete('returnTo')

  const remainingSearchParams = searchParams.toString()

  let validReturnTo

  // only allow returning to internal pages. e.g. /dashboard
  try {
    // if returnTo is a relative path, this will throw an error
    new URL(returnTo)
    // if no error, returnTo is a valid URL and NOT an internal page
    validReturnTo = fallback
  } catch (_) {
    validReturnTo = returnTo
  }

  return validReturnTo + (remainingSearchParams ? `?${remainingSearchParams}` : '')
}

if (IS_PLATFORM && globalThis.window) {
  determineNavigatorLockFeatureFlag()
}
