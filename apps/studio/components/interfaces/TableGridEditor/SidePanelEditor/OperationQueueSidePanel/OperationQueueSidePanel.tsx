import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import {
  Button,
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetSection,
  SheetTitle,
} from 'ui'

import { OperationList } from './OperationList'
import { DiscardChangesConfirmationDialog } from '@/components/ui-patterns/Dialogs/DiscardChangesConfirmationDialog'
import { useConfirmOnClose } from '@/hooks/ui/useConfirmOnClose'
import { getModKeyLabel } from '@/lib/helpers'
import { QueuedOperation } from '@/state/table-editor-operation-queue.types'

export const OperationQueueSidePanel = () => {
  const modKey = getModKeyLabel()
  const snap = useTableEditorStateSnapshot()

  const visible = snap.sidePanel?.type === 'operation-queue'
  const operations = snap.operationQueue.operations as readonly QueuedOperation[]

  const { handleSave, handleCancel, isSaving } = useOperationQueueActions({
    onSaveSuccess: snap.closeSidePanel,
    onCancelSuccess: snap.closeSidePanel,
  })

  const { confirmOnClose, modalProps: closeConfirmationModalProps } = useConfirmOnClose({
    checkIsDirty: () => true,
    onClose: () => handleCancel(),
  })

  return (
    <>
      <Sheet open={visible} onOpenChange={(open) => !open && snap.closeSidePanel()}>
        <SheetContent
          className="flex flex-col gap-y-0"
          onOpenAutoFocus={(event) => event.preventDefault()}
        >
          <SheetHeader>
            <SheetTitle>Pending changes</SheetTitle>
            <SheetDescription>
              {operations.length} operation{operations.length !== 1 ? 's' : ''}
            </SheetDescription>
          </SheetHeader>

          <SheetSection className="overflow-auto flex-grow p-0">
            <OperationList operations={operations} />
          </SheetSection>

          <SheetFooter className="!justify-between">
            <Button type="default" onClick={snap.closeSidePanel}>
              Close
              <span className="text-foreground/40 text-[10px] ml-1.5">{modKey}.</span>
            </Button>
            <div className="flex space-x-3">
              <Button
                type="default"
                onClick={confirmOnClose}
                disabled={isSaving || operations.length === 0}
              >
                Discard
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || operations.length === 0}
                loading={isSaving}
              >
                Save
                <span className="text-foreground/40 text-[10px] ml-1.5">{modKey}S</span>
              </Button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DiscardChangesConfirmationDialog {...closeConfirmationModalProps} />
    </>
  )
}
