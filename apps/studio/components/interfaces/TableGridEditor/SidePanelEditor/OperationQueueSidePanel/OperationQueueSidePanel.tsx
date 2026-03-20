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
import { getModKeyLabel } from '@/lib/helpers'
import { QueuedOperation } from '@/state/table-editor-operation-queue.types'

interface OperationQueueSidePanelProps {
  visible: boolean
  closePanel: () => void
}

export const OperationQueueSidePanel = ({ visible, closePanel }: OperationQueueSidePanelProps) => {
  const modKey = getModKeyLabel()
  const snap = useTableEditorStateSnapshot()

  const operations = snap.operationQueue.operations as readonly QueuedOperation[]

  const { handleSave, handleCancel, isSaving } = useOperationQueueActions({
    onSaveSuccess: closePanel,
    onCancelSuccess: closePanel,
  })

  return (
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
          <Button type="default" onClick={closePanel}>
            Close
            <span className="text-foreground/40 text-[10px] ml-1.5">{modKey}.</span>
          </Button>
          <div className="flex space-x-3">
            <Button
              type="default"
              onClick={handleCancel}
              disabled={isSaving || operations.length === 0}
            >
              Revert{operations.length > 1 && ' all'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || operations.length === 0}
              loading={isSaving}
            >
              Save{operations.length > 1 && ' all'}
              <span className="text-foreground/40 text-[10px] ml-1.5">{modKey}S</span>
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
