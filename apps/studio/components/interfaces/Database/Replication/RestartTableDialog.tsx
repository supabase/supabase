import { toast } from 'sonner'

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
} from 'ui'

interface RestartTableDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectRef?: string
  pipelineId: number
  tableId: number
  tableName: string
  onRestartStart?: () => void
  onRestartComplete?: () => void
}

export const RestartTableDialog = ({
  open,
  onOpenChange,
  projectRef,
  pipelineId,
  tableId,
  tableName,
  onRestartStart,
  onRestartComplete,
}: RestartTableDialogProps) => {
  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: () => {
      toast.success(
        `Restarting replication for "${tableName}". Pipeline will restart automatically.`
      )
      onRestartComplete?.()
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
      onRestartComplete?.()
      onOpenChange(false)
    },
  })

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')

    onRestartStart?.()
    rollbackTables({
      projectRef,
      pipelineId,
      target: { type: 'single_table', table_id: tableId },
      rollbackType: 'full',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Restart replication for <code className="text-code-inline">{tableName}</code>
          </AlertDialogTitle>
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
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
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
