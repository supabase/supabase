export const LOCAL_STORAGE_KEYS = {
  TELEMETRY_CONSENT: 'supabase-consent-ph',
  TELEMETRY_DATA: 'supabase-telemetry-data',
  HIDE_PROMO_TOAST: 'supabase-hide-promo-toast-lw13-d1',
  BLOG_VIEW: 'supabase-blog-view',
}

const LOCAL_STORAGE_KEYS_ALLOWLIST = [
  'graphiql:theme',
  'theme',
  'supabaseDarkMode',
  'supabase.dashboard.auth.debug',
  'supabase.dashboard.auth.navigatorLock.disabled',
  LOCAL_STORAGE_KEYS.TELEMETRY_CONSENT,
]

export function clearLocalStorage() {
  for (const key in localStorage) {
    if (!LOCAL_STORAGE_KEYS_ALLOWLIST.includes(key)) {
      localStorage.removeItem(key)
    }
  }
}
