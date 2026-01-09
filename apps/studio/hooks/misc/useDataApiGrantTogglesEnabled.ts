import { useFlag } from 'common'
import { usePHFlag } from '../ui/useFlag'

/**
 * Determine whether a user has access to Data API grant toggles.
 *
 * Requires that the ConfigCat flag for Data API badges and the PostHog flag
 * for Table Editor API access are both enabled.
 */
export const useDataApiGrantTogglesEnabled = (): boolean => {
  const isDataApiBadgesEnabled = useFlag('dataApiExposedBadge')
  const isTableEditorApiAccessEnabled = usePHFlag<boolean>('tableEditorApiAccessToggle')
  return isDataApiBadgesEnabled && !!isTableEditorApiAccessEnabled
}
