import { useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'

import { tableRowKeys } from 'data/table-rows/keys'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTableEditorStateSnapshot } from 'state/table-editor'
import { Button, SidePanel } from 'ui'

import { OperationList } from './OperationList'
import type { OperationQueueSidePanelProps } from './OperationQueueSidePanel.types'
import { QueuedOperation, QueueStatus } from '@/state/table-editor-operation-queue.types'

export const OperationQueueSidePanel = ({ visible, closePanel }: OperationQueueSidePanelProps) => {
  const queryClient = useQueryClient()
  const { data: project } = useSelectedProjectQuery()
  const snap = useTableEditorStateSnapshot()

  const operations = snap.operationQueue.operations as readonly QueuedOperation[]
  const queueStatus = snap.operationQueue.status as QueueStatus

  const handleSave = useCallback(async () => {
    // TODO: Implement save logic - will be handled by a separate method
    console.log('Save triggered', operations)
  }, [operations])

  const handleCancel = useCallback(() => {
    // Clear the queue and invalidate to revert optimistic updates
    snap.clearQueue()
    if (project) {
      queryClient.invalidateQueries({
        queryKey: tableRowKeys.tableRows(project.ref, {}),
      })
    }
    closePanel()
  }, [snap, project, queryClient, closePanel])

  const isSaving = queueStatus === 'saving'

  return (
    <SidePanel
      size="large"
      visible={visible}
      onCancel={closePanel}
      header={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-1">
            <span>Pending Changes</span>
            <span className="text-xs text-foreground-light font-mono">
              {operations.length} operation{operations.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      }
      customFooter={
        <div className="flex w-full justify-end space-x-3 border-t border-default px-3 py-4">
          <Button type="default" onClick={handleCancel} disabled={isSaving}>
            Cancel All
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || operations.length === 0}
            loading={isSaving}
          >
            Save All
          </Button>
        </div>
      }
    >
      <SidePanel.Content className="py-4">
        <OperationList operations={operations} />
      </SidePanel.Content>
    </SidePanel>
  )
}
