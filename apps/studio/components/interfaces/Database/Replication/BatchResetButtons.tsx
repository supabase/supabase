import { AlertTriangle, RotateCcw } from 'lucide-react'
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

interface BatchResetButtonsProps {
  hasErroredTables: boolean
  totalTables: number
  erroredTablesCount: number
}

type ResetMode = 'all' | 'errored' | null

export const BatchResetButtons = ({
  hasErroredTables,
  totalTables,
  erroredTablesCount,
}: BatchResetButtonsProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [resetMode, setResetMode] = useState<ResetMode>(null)

  const { mutate: rollbackTables, isPending: isResetting } = useRollbackTablesMutation({
    onSuccess: (data) => {
      const count = data.tables.length
      toast.success(
        `Replication restarted for ${count} table${count > 1 ? 's' : ''} and pipeline is being restarted automatically`
      )
      setResetMode(null)
    },
    onError: (error) => {
      toast.error(`Failed to restart replication: ${error.message}`)
      setResetMode(null)
    },
  })

  const handleReset = (mode: 'all' | 'errored') => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!_pipelineId) return toast.error('Pipeline ID is required')

    const pipelineId = Number(_pipelineId)

    rollbackTables({
      projectRef,
      pipelineId,
      target: mode === 'all' ? { type: 'all_tables' } : { type: 'all_errored_tables' },
      rollbackType: 'full',
    })
  }

  const getDialogContent = () => {
    if (resetMode === 'all') {
      return {
        title: 'Restart all tables',
        description: (
          <div className="space-y-3 text-sm">
            <p>
              This will restart replication for <strong>all {totalTables} tables</strong> in this
              pipeline from scratch:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2">
              <li>
                <strong>All table copies will be re-initialized.</strong> Every table will be copied
                again from the source.
              </li>
              <li>
                <strong>All downstream data will be deleted.</strong> All replicated data will be
                removed.
              </li>
              <li>
                <strong>The pipeline will restart automatically.</strong> This is required to apply
                this change.
              </li>
            </ul>
          </div>
        ),
        action: 'Restart all tables',
      }
    } else {
      return {
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
                <strong>Existing downstream data will be deleted.</strong> Replicated data for these
                tables will be removed.
              </li>
              <li>
                <strong>All other tables remain untouched.</strong> Only failed tables are affected.
              </li>
              <li>
                <strong>The pipeline will restart automatically.</strong> This is required to apply
                this change.
              </li>
            </ul>
          </div>
        ),
        action: 'Restart failed tables',
      }
    }
  }

  const dialogContent = resetMode ? getDialogContent() : null

  return (
    <>
      <div className="flex items-center gap-x-2">
        <Button
          size="tiny"
          type="default"
          loading={isResetting && resetMode === 'all'}
          disabled={isResetting || totalTables === 0}
          className="w-min"
          icon={<RotateCcw />}
          onClick={() => setResetMode('all')}
        >
          Restart all tables
        </Button>

        {hasErroredTables && (
          <Button
            size="tiny"
            type="danger"
            loading={isResetting && resetMode === 'errored'}
            disabled={isResetting}
            className="w-min"
            icon={<AlertTriangle />}
            onClick={() => setResetMode('errored')}
          >
            Restart failed tables
          </Button>
        )}
      </div>

      {dialogContent && (
        <AlertDialog open={!!resetMode} onOpenChange={() => setResetMode(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{dialogContent.title}</AlertDialogTitle>
              <AlertDialogDescription>{dialogContent.description}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                disabled={isResetting}
                onClick={() => handleReset(resetMode)}
                variant="danger"
              >
                {isResetting ? 'Restarting replication...' : dialogContent.action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
