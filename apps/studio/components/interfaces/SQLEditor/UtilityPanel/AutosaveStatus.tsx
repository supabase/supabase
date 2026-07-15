import { LOCAL_STORAGE_KEYS, useFlag } from 'common'
import { PowerOff } from 'lucide-react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  useFeaturePreviewModal,
  useIsSqlEditorManualSaveEnabled,
} from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { IS_PLATFORM } from '@/lib/constants'
import { useTrack } from '@/lib/telemetry/track'
import { hasUnsavedChanges } from '@/state/sql-editor/sql-editor-lifecycle'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

export type AutosaveStatusProps = { id: string }

export const AutosaveStatus = ({ id }: AutosaveStatusProps) => {
  const snapV2 = useSqlEditorV2StateSnapshot()
  const track = useTrack()
  const isManualSaveEnabled = useIsSqlEditorManualSaveEnabled()
  const { selectFeaturePreview } = useFeaturePreviewModal()

  // Whether the manual-save preview can actually be opted into. Mirrors the
  // feature preview modal's own filter (platform-only + ConfigCat flag), so we
  // don't offer to "disable autosave" when there's no preview to switch to.
  // `isManualSaveEnabled` also being false for self-hosted / flag-off users is
  // why it can't gate this affordance.
  const sqlEditorManualSaveFlag = useFlag('sqlEditorManualSave')
  const canEnableManualSave = IS_PLATFORM && sqlEditorManualSaveFlag

  if (isManualSaveEnabled) {
    const snippet = snapV2.snippets[id]
    // A snippet only enters the store on its first edit, so a snippet that
    // isn't in the store yet is a fresh, blank, untouched "new query" tab —
    // there's nothing to report a save status for.
    if (snippet === undefined) return null

    const unsavedChanges = hasUnsavedChanges(snippet.snippet.status)

    return (
      <span className="text-xs text-foreground-lighter">
        {unsavedChanges ? 'Unsaved edits' : 'Saved'}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-foreground-lighter">Autosave enabled</span>
      {canEnableManualSave && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="text"
              size="tiny"
              className="px-1"
              aria-label="Disable autosave"
              icon={<PowerOff size={14} className="text-foreground-light" />}
              onClick={() => {
                track('sql_editor_autosave_disable_clicked')
                selectFeaturePreview(LOCAL_STORAGE_KEYS.UI_PREVIEW_SQL_EDITOR_MANUAL_SAVE)
              }}
            />
          </TooltipTrigger>
          <TooltipContent side="bottom">Disable autosave (feature preview)</TooltipContent>
        </Tooltip>
      )}
    </div>
  )
}
