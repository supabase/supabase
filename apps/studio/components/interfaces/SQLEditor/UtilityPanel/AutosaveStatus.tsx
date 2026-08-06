import { LOCAL_STORAGE_KEYS } from 'common'
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

  const canEnableManualSave = IS_PLATFORM

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
