import { usePHFlag } from '../ui/useFlag'
import { IS_TEST_ENV } from '@/lib/constants'

/**
 * Controls the default state of the "Default privileges for new entities"
 * checkbox at project creation. When the flag is on, the checkbox defaults
 * to unchecked (i.e. revoke SQL runs). When off/absent, the checkbox defaults
 * to checked (current behaviour — default grants remain).
 *
 * Scoped to project-creation only. The existing `tableEditorApiAccessToggle`
 * flag continues to gate the integrations → Data API settings surface.
 */
export const useDataApiRevokeOnCreateDefaultEnabled = (): boolean => {
  const flag = usePHFlag<boolean>('dataApiRevokeOnCreateDefault')

  // Preserve current behaviour (default grants remain) in tests so existing
  // E2E flows don't change silently. Tests that need the revoke-default path
  // should opt in explicitly.
  if (IS_TEST_ENV) {
    return false
  }

  return !!flag
}
