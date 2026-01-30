import { useOperationQueueActions } from 'components/grid/hooks/useOperationQueueActions'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button, SidePanel } from 'ui'

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
    <SidePanel
      size="large"
      visible={visible}
      onCancel={closePanel}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <span>Pending changes</span>
            <span className="text-xs text-foreground-light">
              {operations.length} operation{operations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      }
      customFooter={
        <div className="flex w-full justify-between border-t border-default px-3 py-4">
          <Button type="default" onClick={closePanel}>
            Close
            <span className="text-foreground-lighter text-xs ml-1.5">{modKey}.</span>
          </Button>
          <div className="flex space-x-3">
            <Button type="default" onClick={handleCancel} disabled={isSaving}>
              Cancel All
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving || operations.length === 0}
              loading={isSaving}
            >
              Save All
              <span className="text-foreground-lighter text-xs ml-1.5">{modKey}S</span>
            </Button>
          </div>
        </div>
      }
    >
      <SidePanel.Content className="py-4">
        <OperationList operations={operations} />
      </SidePanel.Content>
    </SidePanel>
  )
}
