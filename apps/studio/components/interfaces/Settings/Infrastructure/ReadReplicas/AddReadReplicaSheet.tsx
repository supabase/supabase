import { parseAsBoolean, useQueryState } from 'nuqs'
import { useRef } from 'react'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from 'ui'

import { ReadReplicaForm } from './ReadReplicaForm'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { DocsButton } from '@/components/ui/DocsButton'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { DOCS_URL } from '@/lib/constants'

interface AddReadReplicaSheetProps {
  onSuccess?: () => void
}

export const AddReadReplicaSheet = ({ onSuccess }: AddReadReplicaSheetProps) => {
  const [addReplica, setAddReplica] = useQueryState(
    'addReplica',
    parseAsBoolean.withDefault(false).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const visible = addReplica === true
  const checkIsDirtyRef = useRef<() => boolean>(() => false)

  const onClose = () => {
    checkIsDirtyRef.current = () => false
    setAddReplica(false)
  }

  const { confirmOnClose, handleOpenChange, modalProps } = useConfirmOnClose({
    checkIsDirty: () => checkIsDirtyRef.current(),
    onClose,
  })

  return (
    <>
      <Sheet open={visible} onOpenChange={handleOpenChange}>
        <SheetContent size="lg" showClose={false} className="max-w-3xl">
          <div className="flex flex-col h-full min-h-0" tabIndex={-1}>
            <SheetHeader className="flex items-center justify-between">
              <div>
                <SheetTitle>Add read replica</SheetTitle>
                <SheetDescription>
                  Deploy a read-only copy of the complete Postgres database.
                </SheetDescription>
              </div>
              <DocsButton
                href={`${DOCS_URL}/guides/platform/read-replicas`}
                topic="read replica settings"
              />
            </SheetHeader>

            <ReadReplicaForm
              checkIsDirtyRef={checkIsDirtyRef}
              onClose={onClose}
              onCancel={confirmOnClose}
              onSuccess={() => onSuccess?.()}
            />
          </div>
        </SheetContent>
      </Sheet>
      <DiscardChangesConfirmationDialog {...modalProps} />
    </>
  )
}
