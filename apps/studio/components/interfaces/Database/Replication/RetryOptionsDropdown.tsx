import { ChevronDown, RotateCcw, Undo2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useRestartPipelineHelper } from 'data/replication/restart-pipeline-helper'
import { RollbackType, useRollbackTableMutation } from 'data/replication/rollback-table-mutation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

const RETRY_OPTIONS = [
  {
    type: 'individual' as RollbackType,
    icon: <Undo2 className="w-3 h-3 mt-0.5" />,
    title: 'Rollback to previous state',
    description: 'Restart from the last working state (may not be enough in some cases)',
  },
  {
    type: 'full' as RollbackType,
    icon: <RotateCcw className="w-3 h-3 mt-0.5" />,
    title: 'Reset from scratch',
    description: 'Completely restart replicating this table',
  },
] as const

interface RetryOptionsDropdownProps {
  tableId: number
  tableName: string
}

export const RetryOptionsDropdown = ({ tableId, tableName }: RetryOptionsDropdownProps) => {
  const { ref: projectRef, pipelineId: _pipelineId } = useParams()
  const [isOpen, setIsOpen] = useState(false)
  const [isRestartingPipeline, setIsRestartingPipeline] = useState(false)

  const { restartPipeline } = useRestartPipelineHelper()

  const { mutate: rollbackTable, isPending: isRollingBack } = useRollbackTableMutation({
    onSuccess: async (_, vars) => {
      const { projectRef, pipelineId, rollbackType } = vars
      toast.success(
        `Table "${tableName}" ${rollbackType === 'full' ? 'reset' : 'rolled back'} successfully and pipeline is being restarted`
      )

      setIsRestartingPipeline(true)
      try {
        await restartPipeline({ projectRef, pipelineId })
        toast.success('Pipeline restarted successfully')
      } catch (error: any) {
        toast.error(`Failed to restart pipeline: ${error.message}`)
      } finally {
        setIsRestartingPipeline(false)
        setIsOpen(false)
      }
    },
    onError: (error, vars) => {
      const { rollbackType } = vars
      toast.error(
        `Failed to ${rollbackType === 'full' ? 'reset' : 'rollback'} table: ${error.message}`
      )
    },
  })

  const isLoading = isRollingBack || isRestartingPipeline

  const handleRollback = async (rollbackType: RollbackType) => {
    if (!projectRef) return toast.error('Project ref is required')
    if (!_pipelineId) return toast.error('Pipeline ID is required')

    const pipelineId = Number(_pipelineId)

    rollbackTable({
      projectRef,
      pipelineId,
      tableId,
      rollbackType,
    })
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          size="tiny"
          type="default"
          loading={isLoading}
          disabled={isLoading}
          className="w-min"
          iconRight={<ChevronDown />}
          aria-label={`Rollback ${tableName}`}
        >
          Rollback
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72" aria-label="Rollback options">
        {RETRY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.type}
            disabled={isLoading}
            className="flex flex-col items-start px-3 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby={`rollback-${option.type}-description`}
            onClick={() => handleRollback(option.type)}
          >
            <div className="flex items-start gap-x-2 w-full">
              <div className="min-w-4">{option.icon}</div>
              <div
                id={`rollback-${option.type}-description`}
                className="flex flex-col gap-y-1 text-xs"
              >
                <p>{option.title}</p>
                <p className="text-foreground-light">{option.description}</p>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
