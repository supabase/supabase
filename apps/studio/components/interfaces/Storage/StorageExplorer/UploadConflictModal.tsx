import { useState } from 'react'
import { RadioGroupStacked, RadioGroupStackedItem, ScrollArea } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import type { UploadConflictResolution, UploadConflicts } from './StorageExplorer.utils'
import { getUploadConflictCopy } from './UploadConflictModal.utils'

/** Cancelling is reported through `onCancel` instead, so the radio never carries it. */
export type UploadConflictChoice = Exclude<UploadConflictResolution, 'cancel'>

interface UploadConflictModalProps {
  /** Names the upload would land on. Empty keeps the modal closed. */
  conflicts: UploadConflicts
  onCancel: () => void
  onConfirm: (choice: UploadConflictChoice) => void
}

/**
 * Asked before an upload overwrites something, including something only the archived view
 * can see. Mounted for a bucket that retains versions — elsewhere the explorer renames
 * instead of offering a choice that would lose the existing file.
 */
export const UploadConflictModal = ({
  conflicts,
  onCancel,
  onConfirm,
}: UploadConflictModalProps) => {
  const [choice, setChoice] = useState<UploadConflictChoice>('replace')

  const { liveNames, archivedNames } = conflicts
  const conflictCount = liveNames.length + archivedNames.length
  const hasMultipleConflicts = conflictCount > 1
  const copy = getUploadConflictCopy(conflicts)

  const handleCancel = () => {
    setChoice('replace')
    onCancel()
  }

  const handleConfirm = () => {
    setChoice('replace')
    onConfirm(choice)
  }

  return (
    <ConfirmationModal
      size="medium"
      visible={conflictCount > 0}
      loading={false}
      title={<span className="wrap-break-word">{copy.title}</span>}
      description={copy.description}
      confirmLabel="Upload"
      onCancel={handleCancel}
      onConfirm={handleConfirm}
    >
      <RadioGroupStacked
        value={choice}
        onValueChange={(value) => setChoice(value as UploadConflictChoice)}
      >
        <RadioGroupStackedItem
          value="replace"
          label={copy.replaceLabel}
          className="[&_p]:text-pretty!"
          description={copy.replaceDescription}
        />
        <RadioGroupStackedItem
          value="keep-both"
          label={copy.keepBothLabel}
          className="[&_p]:text-pretty!"
          description={copy.keepBothDescription}
        />
      </RadioGroupStacked>

      {hasMultipleConflicts && (
        <ScrollArea className="mt-3 rounded-md border">
          <ul className="px-4 py-2 max-h-32 overflow-y-auto bg-surface-200 dark:bg-surface-100/50 text-xs text-foreground-light divide-y divide-border">
            {liveNames.map((name) => (
              <li key={name} className="text-sm py-1 wrap-break-word">
                {name}
              </li>
            ))}
            {archivedNames.map((name) => (
              <li
                key={name}
                className="text-sm py-1 flex items-center justify-between gap-x-2 wrap-break-word"
              >
                {name}
                <span className="text-xs text-foreground-lighter shrink-0">Archived</span>
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </ConfirmationModal>
  )
}
