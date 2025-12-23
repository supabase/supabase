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
  variant?: 'default' | 'warning'
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
        `Table "${tableName}" reset successfully and pipeline is being restarted automatically`
      )
      setIsOpen(false)
    },
    onError: (error) => {
      toast.error(`Failed to reset table: ${error.message}`)
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
        aria-label={`Reset and restart table ${tableName}`}
        onClick={() => setIsOpen(true)}
      >
        Reset table and restart
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reset table and restart</AlertDialogTitle>
          <AlertDialogDescription>
            This will reset replication for <code className="text-code-inline">{tableName}</code>{' '}
            only. The table will be copied again from scratch, and any existing downstream data for
            it will be deleted. Other tables in the pipeline are not affected, but the pipeline will
            restart automatically to apply this reset.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="danger">
            {isResetting ? 'Resetting table and restarting pipeline...' : 'Reset and restart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
