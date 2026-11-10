import { IS_PLATFORM } from 'common'

import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useEnabledFeaturesOverrideQuery } from '@/data/misc/enabled-features-override-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'

export function useFunctionObservability() {
  const preview = useUnifiedLogsPreview()
  const logsEnabled = useIsFeatureEnabled('logs:all')
  const overrides = useEnabledFeaturesOverrideQuery()
  const isAvailable = IS_PLATFORM || (overrides.isSuccess && logsEnabled)

  return {
    isAvailable,
    isEnabled: IS_PLATFORM ? preview.isEnabled : isAvailable,
    isLoading: IS_PLATFORM ? preview.isLoading : overrides.isPending,
    error: overrides.error,
  }
}
