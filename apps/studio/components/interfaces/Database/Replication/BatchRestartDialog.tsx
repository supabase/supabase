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

interface BatchRestartDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectRef?: string
  pipelineId: number
  mode: 'all' | 'errored'
  totalTables: number
  erroredTablesCount: number
}

export const BatchRestartDialog = ({
  open,
  onOpenChange,
  projectRef,
  pipelineId,
  mode,
  totalTables,
  erroredTablesCount,
}: BatchRestartDialogProps) => {
  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(
        `Replication restarted for ${count} table${count > 1 ? 's' : ''} and pipeline is being restarted automatically`
      )
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
      onOpenChange(false)
    },
  })

  const handleReset = () => {
    if (!projectRef) return toast.error('Project ref is required')

    rollbackTables({
      projectRef,
      pipelineId,
      target: mode === 'all' ? { type: 'all_tables' } : { type: 'all_errored_tables' },
      rollbackType: 'full',
    })
  }

  const dialogContent =
    mode === 'all'
      ? {
          title: 'Restart all tables',
          description: (
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for <strong>all {totalTables} tables</strong> in this
                pipeline from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>All table copies will be re-initialized.</strong> Every table will be
                  copied again from the source.
                </li>
                <li>
                  <strong>All downstream data will be deleted.</strong> All replicated data will be
                  removed.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart all tables',
        }
      : {
          title: 'Restart failed tables',
          description: (
            <div className="space-y-3 text-sm">
              <p>
                This will restart replication for{' '}
                <strong>all {erroredTablesCount} failed tables</strong> from scratch:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li>
                  <strong>Failed table copies will be re-initialized.</strong> These tables will be
                  copied again from the source.
                </li>
                <li>
                  <strong>Existing downstream data will be deleted.</strong> Replicated data for
                  these tables will be removed.
                </li>
                <li>
                  <strong>All other tables remain untouched.</strong> Only failed tables are
                  affected.
                </li>
                <li>
                  <strong>The pipeline will restart automatically.</strong> This is required to
                  apply this change.
                </li>
              </ul>
            </div>
          ),
          action: 'Restart failed tables',
        }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
          <AlertDialogDescription asChild>{dialogContent.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={isResetting} onClick={handleReset} variant="danger">
            {isResetting ? 'Restarting replication...' : dialogContent.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
