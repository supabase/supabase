import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useTableReset } from 'data/etl/use-table-reset'
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
          <AlertDialogTitle>Reset and restart table "{tableName}"?</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-y-3 py-4 !mt-0">
            <p>
              This will reset and restart replication for this table only. The table will start
              copying from scratch, and any existing data for this table downstream will be deleted.
            </p>
            <p className="text-foreground-light">
              Other tables in the pipeline will not be affected. Only this table will be restarted
              and go through the full replication process again, starting with the initial copy
              phase.
            </p>
            <p className="text-foreground-light">
              The pipeline will be restarted to apply the table reset.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={isResetting}
            onClick={handleReset}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isRollingBack
              ? 'Resetting table...'
              : isRestartingPipeline
                ? 'Restarting pipeline...'
                : 'Confirm reset and restart'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
