/**
 * DEBUG-242 throwaway prototype gate: fake OpenTelemetry trace data joined
 * onto unified logs, for design review only. Dev/staging-only and opt-in via
 * localStorage, so it never affects a real project. Enable in the browser
 * console with:
 *   localStorage.setItem('supabase-unified-logs-trace-prototype', 'true')
 * then reload the Logs page.
 */
import { LOCAL_STORAGE_KEYS, safeLocalStorage } from 'common'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

const IS_NON_PRODUCTION_ENV =
  process.env.NODE_ENV === 'development' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'local' ||
  process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'

export const useTracePrototypeEnabled = (): boolean => {
  const [enabled] = useLocalStorageQuery<boolean>(
    LOCAL_STORAGE_KEYS.UNIFIED_LOGS_TRACE_PROTOTYPE,
    false
  )
  return IS_NON_PRODUCTION_ENV && enabled
}

/**
 * Non-reactive equivalent for call sites that aren't React hooks (e.g. the
 * fixture dataset builder) — same gate, read directly from localStorage.
 */
export function isTracePrototypeEnabledSync(): boolean {
  if (!IS_NON_PRODUCTION_ENV) return false
  const raw = safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.UNIFIED_LOGS_TRACE_PROTOTYPE)
  if (!raw) return false
  try {
    return JSON.parse(raw) === true
  } catch {
    return false
  }
}
