import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useRollbackTablesMutation } from 'data/replication/rollback-tables-mutation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

interface ResetTableButtonProps {
  tableId: number
  tableName: string
  variant?: 'default' | 'warning' | 'danger'
}

export const ResetTableButton = ({
  tableId,
  tableName,
  variant = 'default',
}: ResetTableButtonProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(
        `Replication restarted for "${tableName}" and pipeline is being restarted automatically`
      )
      setIsOpen(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
      setIsOpen(false)
    },
  })

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!_pipelineId) return toast.error('Pipeline ID is required')

    const pipelineId = Number(_pipelineId)

    rollbackTables({
      projectRef,
      pipelineId,
      target: { type: 'single_table', table_id: tableId },
      rollbackType: 'full',
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        size="tiny"
        type={variant}
        loading={isResetting}
        disabled={isResetting}
        className="w-min"
        icon={<RotateCcw />}
        aria-label={`Restart replication for ${tableName}`}
        onClick={() => setIsOpen(true)}
      >
        Restart replication
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restart replication for {tableName}</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for{' '}
                <code className="text-code-inline">{tableName}</code> from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>The table copy will be re-initialized.</strong> All data will be copied
                  again from the source.
                </li>
                <li>
                  <strong>Existing downstream data will be deleted.</strong> Any replicated data for
                  this table will be removed.
                </li>
                <li>
                  <strong>All other tables remain untouched.</strong> Only this table is affected.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to apply
                  this change.
                </li>
              </ul>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="danger">
            {isResetting ? 'Restarting replication...' : 'Restart replication'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
