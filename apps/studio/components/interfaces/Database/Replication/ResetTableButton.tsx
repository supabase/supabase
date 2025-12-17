import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useTableReset } from 'data/replication/use-table-reset'
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
}

export const ResetTableButton = ({ tableId, tableName }: ResetTableButtonProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [isOpen, setIsOpen] = useState(false)

  const { resetTable, isRollingBack, isRestartingPipeline, isResetting } = useTableReset({
    tableName,
    onSuccess: () => setIsOpen(false),
    onError: () => setIsOpen(false),
  })

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!_pipelineId) return toast.error('Pipeline ID is required')

    const pipelineId = Number(_pipelineId)

    resetTable({
      projectRef,
      pipelineId,
      tableId,
      rollbackType: 'full',
    })
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button
        size="tiny"
        type="default"
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
            restart to apply this reset.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="danger">
            {isRollingBack
              ? 'Resetting table...'
              : isRestartingPipeline
                ? 'Restarting pipeline...'
                : 'Reset and restart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
