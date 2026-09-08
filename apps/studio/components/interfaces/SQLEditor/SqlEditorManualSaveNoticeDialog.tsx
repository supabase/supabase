import { LOCAL_STORAGE_KEYS, safeLocalStorage, useFlag } from 'common'
import { useEffect } from 'react'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  KeyboardShortcut,
} from 'ui'

import { shouldShowManualSaveNotice } from './SqlEditorManualSaveNoticeDialog.utils'
import { useFeaturePreviewContext } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useLocalStorageQuery } from '@/hooks/misc/useLocalStorage'
import { IS_PLATFORM } from '@/lib/constants'

/**
 * One-time notice for users the manual saving rollout switches over, shown the
 * first time they land on a SQL Editor route. Users who opted into the preview
 * themselves already know the behavior and never see it.
 */
export const SqlEditorManualSaveNoticeDialog = () => {
  const { isInitialized } = useFeaturePreviewContext()
  const isForced = useFlag('sqlEditorManualSaveForced')

  const [isNoticeDismissed, setIsNoticeDismissed, { isSuccess: isDismissalLoaded }] =
    useLocalStorageQuery(LOCAL_STORAGE_KEYS.SQL_EDITOR_MANUAL_SAVE_NOTICE_DISMISSED, false)

  const hasOptedIntoPreview =
    safeLocalStorage.getItem(LOCAL_STORAGE_KEYS.UI_PREVIEW_SQL_EDITOR_MANUAL_SAVE) === 'true'

  // Record the dismissal up front for users who opted in themselves. The notice
  // outlives the feature preview — once the preview is retired there's no stored
  // opt-in left to recognize them by, and without this they'd be shown a notice
  // about behavior they chose.
  useEffect(() => {
    if (isDismissalLoaded && hasOptedIntoPreview && !isNoticeDismissed) {
      setIsNoticeDismissed(true)
    }
  }, [isDismissalLoaded, hasOptedIntoPreview, isNoticeDismissed, setIsNoticeDismissed])

  const isOpen =
    isDismissalLoaded &&
    shouldShowManualSaveNotice({
      isPlatform: IS_PLATFORM,
      isFeaturePreviewInitialized: isInitialized,
      isForced,
      hasOptedIntoPreview,
      isNoticeDismissed,
    })

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && setIsNoticeDismissed(true)}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Snippets no longer save automatically</DialogTitle>
          <DialogDescription>
            The SQL Editor now saves your snippets only when you save them.
          </DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className="text-sm">
          <ul className="list-disc pl-6 text-foreground-light space-y-1">
            <li>
              Save with the Save button next to Run, or with{' '}
              <KeyboardShortcut keys={['Meta', 's']} />
            </li>
            <li>Tabs with unsaved edits show a dot</li>
            <li>Closing a tab with unsaved edits discards them</li>
          </ul>
        </DialogSection>

        <DialogFooter>
          <Button onClick={() => setIsNoticeDismissed(true)}>Understood</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
