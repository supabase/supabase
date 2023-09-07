import { IS_PLATFORM } from './constants'

export const LOCAL_STORAGE_KEYS_ALLOWLIST = [
  'graphiql:theme',
  'theme',
  'supabaseDarkMode',
  'supabase.dashboard.sign_in_clicks_v3',
  'supabase.dashboard.auth.debug',
  'supabase.dashboard.auth.navigatorLock.disabled',
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}

function inferSignInClicks() {
  // remove old data from local storage
  ['', '_v2'].forEach(suffix => {
    localStorage.removeItem(`supabase.dashboard.sign_in_clicks${suffix}`)
  })

  if (localStorage.getItem('supabase.dashboard.sign_in_clicks_v3')) {
    return
  }

  localStorage.setItem(
    'supabase.dashboard.sign_in_clicks_v3',
    localStorage.getItem('supabase.dashboard.auth.token') ? '1' : '0'
  )
}

export function getSignInClicks(): number {
  let count: number | null = null

  try {
    count = JSON.parse(localStorage.getItem('supabase.dashboard.sign_in_clicks_v3') || '0')
  } catch (e: any) {
    // do nothing
  }

  return count || 0
}

export function incrementSignInClicks(): number {
  const clicks = getSignInClicks()

  localStorage.setItem('supabase.dashboard.sign_in_clicks_v3', JSON.stringify(clicks + 1))

  return clicks + 1
}

export function resetSignInClicks(): number {
  const clicks = getSignInClicks()

  localStorage.setItem('supabase.dashboard.sign_in_clicks_v3', '0')

  return clicks
}

if (globalThis && globalThis.localStorage && IS_PLATFORM) {
  // populate the value based on the current local storage state
  inferSignInClicks()
}
