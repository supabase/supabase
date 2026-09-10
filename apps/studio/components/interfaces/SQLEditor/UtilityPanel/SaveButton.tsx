import { Loader2 } from 'lucide-react'
import { Button, KeyboardShortcut } from 'ui'

import { hasUnsavedChanges, isSaving } from '@/state/sql-editor/sql-editor-lifecycle'
import { useSqlEditorSaveCoordinator } from '@/state/sql-editor/sql-editor-save-coordinator'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

interface SqlSaveButtonProps {
  id: string
  className?: string
}

export const SqlSaveButton = ({ id, className }: SqlSaveButtonProps) => {
  const snapV2 = useSqlEditorV2StateSnapshot()
  const { requestSave } = useSqlEditorSaveCoordinator()

  const status = snapV2.snippets[id]?.snippet.status
  const saving = isSaving(status)
  const isDirty = hasUnsavedChanges(status) && !saving

  return (
    <Button
      onClick={() => requestSave(id)}
      disabled={!isDirty}
      variant="default"
      size="tiny"
      data-testid="sql-save-button"
      iconRight={
        saving ? (
          <Loader2 className="animate-spin" size={10} strokeWidth={1.5} />
        ) : (
          <KeyboardShortcut keys={['Meta', 's']} variant="inline" />
        )
      }
      className={className}
    >
      Save
    </Button>
  )
}
