import { Button } from 'ui'

import { ExplorerQueryFooter } from '../ExplorerQuery'
import type { QueryResultEditing } from './useQueryResultEditing'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { pluralize } from '@/lib/helpers'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

/**
 * Stands in for the result footer while a result has unsaved edits, so saving or discarding
 * them is always one click away from the cells they came from.
 */
export const QueryResultEditsBar = ({
  editing,
  isShortcutEnabled,
}: {
  editing: QueryResultEditing
  /** Off where the surrounding surface already owns the save shortcut, such as a notebook. */
  isShortcutEnabled: boolean
}) => {
  const count = editing.pendingEdits.length
  const { confirmOnClose, modalProps } = useConfirmOnClose({
    checkIsDirty: () => true,
    onClose: editing.discardEdits,
  })

  useShortcut(SHORTCUT_IDS.OPERATION_QUEUE_SAVE, editing.saveEdits, {
    enabled: isShortcutEnabled && editing.canSave,
  })

  return (
    <>
      <ExplorerQueryFooter className="flex items-center justify-between gap-x-2 py-1.5">
        <p className="text-warning">
          {count.toLocaleString()} pending {pluralize(count, 'change')}
        </p>
        <div className="flex items-center gap-x-2">
          <Button
            variant="default"
            size="tiny"
            disabled={editing.isSaving}
            onClick={confirmOnClose}
          >
            Discard
          </Button>
          <Button
            variant="primary"
            size="tiny"
            loading={editing.isSaving}
            disabled={!editing.canSave}
            iconRight={
              isShortcutEnabled && !editing.isSaving ? (
                <ShortcutBadge shortcutId={SHORTCUT_IDS.OPERATION_QUEUE_SAVE} />
              ) : undefined
            }
            onClick={editing.saveEdits}
          >
            Save
          </Button>
        </div>
      </ExplorerQueryFooter>
      <DiscardChangesConfirmationDialog
        {...modalProps}
        title={`Discard ${count} pending ${pluralize(count, 'change')}?`}
        description="The edited cells go back to the values in the database."
        confirmLabel="Discard changes"
      />
    </>
  )
}
