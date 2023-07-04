import { GoTrueClient } from '@supabase/gotrue-js'

export const STORAGE_KEY = process.env.NEXT_PUBLIC_STORAGE_KEY || 'supabase.dashboard.auth.token'
export const AUTH_DEBUG_KEY =
  process.env.NEXT_PUBLIC_AUTH_DEBUG_KEY || 'supabase.dashboard.auth.debug'

const debug =
  process.env.NEXT_PUBLIC_IS_PLATFORM === 'true' &&
  globalThis &&
  globalThis.localStorage &&
  globalThis.localStorage.getItem(AUTH_DEBUG_KEY) === 'true'

export const gotrueClient = new GoTrueClient({
  url: process.env.NEXT_PUBLIC_GOTRUE_URL,
  storageKey: STORAGE_KEY,
  detectSessionInUrl: true,
  // @ts-expect-error
  debug,
})
