import { GoTrueClient, navigatorLock } from '@supabase/gotrue-js'

export const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'supabase.dashboard.auth.token'
export const AUTH_DEBUG_KEY =
  process.env.NEXT_PUBLIC_AUTH_DEBUG_KEY || 'supabase.dashboard.auth.debug'
export const AUTH_NAVIGATOR_LOCK_KEY =
  process.env.NEXT_PUBLIC_AUTH_NAVIGATOR_LOCK_KEY || 'supabase.dashboard.auth.navigatorLock.enabled'

const debug =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  globalThis?.localStorage?.getItem(AUTH_DEBUG_KEY) === 'true'

const navigatorLockEnabled =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  globalThis?.localStorage?.getItem(AUTH_NAVIGATOR_LOCK_KEY) === 'true'

export const gotrueClient = new GoTrueClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL,
  storageKey: STORAGE_KEY,
  detectSessionInUrl: true,
  debug,
  lock: navigatorLockEnabled ? navigatorLock : undefined,
})
