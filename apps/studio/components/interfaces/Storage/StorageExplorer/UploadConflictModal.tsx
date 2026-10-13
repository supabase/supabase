import { useState } from 'react'
import { RadioGroupStacked, RadioGroupStackedItem, ScrollArea } from 'ui'
import { ConfirmationModal } from 'ui-patterns/Dialogs/ConfirmationModal'

import type { UploadConflictResolution } from './StorageExplorer.utils'

export type UploadConflictChoice = Exclude<UploadConflictResolution, 'cancel'>

interface UploadConflictModalProps {
  conflictingNames: string[]
  onCancel: () => void
  onConfirm: (choice: UploadConflictChoice) => void
}

export const UploadConflictModal = ({
  conflictingNames,
  onCancel,
  onConfirm,
}: UploadConflictModalProps) => {
  const [choice, setChoice] = useState<UploadConflictChoice>('replace')

  const hasMultipleConflicts = conflictingNames.length > 1

  const title = hasMultipleConflicts
    ? `${conflictingNames.length} files already exist here`
    : `${conflictingNames[0]} already exists here`

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
      visible={conflictingNames.length > 0}
      loading={false}
      title={<span className="wrap-break-word">{title}</span>}
      description={
        hasMultipleConflicts
          ? 'Choose what happens to the existing files.'
          : 'Choose what happens to the existing file.'
      }
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
          label={hasMultipleConflicts ? 'Replace existing files' : 'Replace existing file'}
          className="[&_p]:text-pretty!"
          description={
            hasMultipleConflicts
              ? 'Each file you replace becomes a noncurrent version you can restore from its version history'
              : 'The file you replace becomes a noncurrent version you can restore from its version history'
          }
        />
        <RadioGroupStackedItem
          value="keep-both"
          label={hasMultipleConflicts ? 'Keep all files' : 'Keep both files'}
          className="[&_p]:text-pretty!"
          description={
            hasMultipleConflicts
              ? 'Keeps the existing files and appends an incremental number to the names'
              : 'Keeps the existing file and appends an incremental number to the name'
          }
        />
      </RadioGroupStacked>

      {hasMultipleConflicts && (
        <ScrollArea className="mt-3 rounded-md border">
          <ul className="px-4 py-2 max-h-32 overflow-y-auto bg-surface-200 dark:bg-surface-100/50 text-xs text-foreground-light divide-y divide-border">
            {conflictingNames.map((name, i) => (
              <li key={name} className="text-sm py-1 wrap-break-word">
                {name}
              </li>
            ))}
          </ul>
        </ScrollArea>
      )}
    </ConfirmationModal>
  )
}
