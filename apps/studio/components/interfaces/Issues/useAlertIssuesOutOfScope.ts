import { LOCAL_STORAGE_KEYS } from 'common'

import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'

/**
 * Whether the alert issues UI shows features that are out of scope for the current demo:
 * every agentic feature (the Assistant, @assistant replies and initial investigations).
 * Off by default, remembered per browser.
 */
export const useAlertIssuesOutOfScope = () => {
  const [isOutOfScopeVisible, setIsOutOfScopeVisible] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.ALERT_ISSUES_OUT_OF_SCOPE_VISIBLE,
    false
  )
  return { isOutOfScopeVisible, setIsOutOfScopeVisible }
}
