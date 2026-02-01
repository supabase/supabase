import { useFlag } from 'common'
import { IS_TEST_ENV } from 'lib/constants'
import { usePHFlag } from '../ui/useFlag'

/**
 * Determine whether a user has access to Data API grant toggles.
 *
 * Requires that the ConfigCat flag for Data API badges and the PostHog flag
 * for Table Editor API access are both enabled.
 *
 * In test environments, this returns true to allow E2E testing of the feature
 * without requiring the feature flag infrastructure.
 */
export const useDataApiGrantTogglesEnabled = (): boolean => {
  const isDataApiBadgesEnabled = useFlag('dataApiExposedBadge')
  const isTableEditorApiAccessEnabled = usePHFlag<boolean>('tableEditorApiAccessToggle')

  // In test environment, enable the feature for E2E testing
  if (IS_TEST_ENV) {
    return true
  }

  return isDataApiBadgesEnabled && !!isTableEditorApiAccessEnabled
}
