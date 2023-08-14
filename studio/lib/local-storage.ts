import { IS_PLATFORM } from './constants'

export const LOCAL_STORAGE_KEYS_ALLOWLIST = [
  'graphiql:theme',
  'theme',
  'supabaseDarkMode',
  'supabase.dashboard.sign_in_clicks_v2',
  'supabase.dashboard.auth.debug',
  'supabase.dashboard.auth.navigatorLock.enabled',
  'supabase.dashboard.auth.ff.threshold.navigatorLock',
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}

function inferSignInClicks() {
  if (localStorage.getItem('supabase.dashboard.sign_in_clicks_v2')) {
    return
  }

  localStorage.setItem(
    'supabase.dashboard.sign_in_clicks_v2',
    localStorage.getItem('supabase.dashboard.auth.token') ? '1' : '0'
  )
}

export function getSignInClicks(): number {
  let count: number | null = null

  try {
    count = JSON.parse(localStorage.getItem('supabase.dashboard.sign_in_clicks_v2') || '0')
  } catch (e: any) {
    // do nothing
  }

  return count || 0
}

export function incrementSignInClicks(): number {
  const clicks = getSignInClicks()

  localStorage.setItem('supabase.dashboard.sign_in_clicks_v2', JSON.stringify(clicks + 1))

  return clicks + 1
}

export function resetSignInClicks(): number {
  const clicks = getSignInClicks()

  localStorage.setItem('supabase.dashboard.sign_in_clicks_v2', '0')

  return clicks
}

export function getNavigatorLockFeatureFlagThreshold() {
  const str = localStorage.getItem('supabase.dashboard.auth.ff.threshold.navigatorLock')

  return str ? parseInt(str) : null
}

function determineNavigatorLockFeatureFlagThreshold() {
  if (getNavigatorLockFeatureFlagThreshold()) {
    return
  }

  localStorage.setItem(
    'supabase.dashboard.auth.ff.threshold.navigatorLock',
    `${Math.floor(Math.random() * 100)}`
  )
}

export function setNavigatorLockEnabled(enabled: boolean) {
  localStorage.setItem('supabase.dashboard.auth.navigatorLock.enabled', enabled ? 'true' : 'false')
}

if (globalThis && globalThis.localStorage && IS_PLATFORM) {
  // populate the value based on the current local storage state
  inferSignInClicks()

  // setup the navigator lock group on initial load
  determineNavigatorLockFeatureFlagThreshold()
}
