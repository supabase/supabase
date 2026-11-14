import { IS_PLATFORM, LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import {
  useFeaturePreviewContext,
  useFeaturePreviewModal,
  useIsExplorerEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'

/**
 * Suggests turning on the Explorer feature preview. Shown on pages that are reachable by direct
 * link while the preview is off (and its navigation item hidden).
 */
export const ExplorerPreviewSuggestion = ({ className }: { className?: string }) => {
  const { isInitialized } = useFeaturePreviewContext()
  const { selectFeaturePreview } = useFeaturePreviewModal()
  const isExplorerAvailable = useFlag('explorer')
  const isExplorerEnabled = useIsExplorerEnabled()

  const shouldShowSuggestion =
    IS_PLATFORM && isExplorerAvailable && isInitialized && !isExplorerEnabled

  if (!shouldShowSuggestion) return null

  return (
    <Admonition
      type="default"
      layout="responsive"
      className={className}
      title="Explorer is a feature preview"
      description="Enable the Explorer preview to find notebooks from the navigation bar."
      actions={
        <Button
          variant="default"
          onClick={() => selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_EXPLORER)}
        >
          Enable Explorer
        </Button>
      }
    />
  )
}
