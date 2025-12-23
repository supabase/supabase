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
        `${count} table${count > 1 ? 's' : ''} reset successfully and pipeline is being restarted automatically`
      )
      setResetMode(null)
    },
    onError: (error) => {
      toast.error(`Failed to reset tables: ${error.message}`)
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
        title: 'Reset all tables and restart',
        description: (
          <>
            This will reset replication for <strong>all {totalTables} tables</strong> in this
            pipeline. All tables will be copied again from scratch, and any existing downstream data
            will be deleted. The pipeline will restart automatically to apply this reset.
          </>
        ),
        action: 'Reset all tables and restart',
      }
    } else {
      return {
        title: 'Reset all failed tables and restart',
        description: (
          <>
            This will reset replication for <strong>all {erroredTablesCount} failed tables</strong>{' '}
            in this pipeline. These tables will be copied again from scratch, and any existing
            downstream data for them will be deleted. Other tables are not affected, but the
            pipeline will restart automatically to apply this reset.
          </>
        ),
        action: 'Reset failed tables and restart',
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
          Reset all tables
        </Button>

        {hasErroredTables && (
          <Button
            size="tiny"
            type="warning"
            loading={isResetting && resetMode === 'errored'}
            disabled={isResetting}
            className="w-min"
            icon={<AlertTriangle />}
            onClick={() => setResetMode('errored')}
          >
            Reset all failed tables
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
                {isResetting
                  ? 'Resetting tables and restarting pipeline...'
                  : dialogContent.action}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  )
}
