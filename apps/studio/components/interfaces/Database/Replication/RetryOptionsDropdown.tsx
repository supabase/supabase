import { useState } from 'react'
import { ChevronDown, RotateCcw, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { RollbackType, useRollbackTableMutation } from 'data/replication/rollback-table-mutation'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

// Define retry options as a constant for better maintainability
const RETRY_OPTIONS = [
  {
    type: 'individual' as RollbackType,
    icon: <Undo2 className="w-3 h-3" />,
    title: 'Rollback to previous state',
    description: 'Restart from the last working state',
  },
  {
    type: 'full' as RollbackType,
    icon: <RotateCcw className="w-3 h-3" />,
    title: 'Reset from scratch',
    description: 'Completely restart the table replication',
  },
] as const

interface RetryOptionsDropdownProps {
  projectRef: string
  pipelineId: number
  tableId: number
  tableName: string
}

export const RetryOptionsDropdown = ({
  projectRef,
  pipelineId,
  tableId,
  tableName,
}: RetryOptionsDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentAction, setCurrentAction] = useState<RollbackType | null>(null)

  const { mutateAsync: rollbackTable, isLoading: isRollingBack } = useRollbackTableMutation()
  const { mutateAsync: startPipeline, isLoading: isRestartingPipeline } = useStartPipelineMutation()

  const isLoading = isRollingBack || isRestartingPipeline

  const handleRollback = async (rollbackType: RollbackType) => {
    try {
      setCurrentAction(rollbackType)

      const actionText =
        rollbackType === 'full' ? 'reset from scratch' : 'roll back to previous state'

      // First rollback the table
      await rollbackTable({
        projectRef,
        pipelineId,
        tableId,
        rollbackType,
      })

      toast.success(`Table "${tableName}" rolled back successfully`)

      // Then restart the pipeline
      await startPipeline({ projectRef, pipelineId })
      toast.success('Pipeline restarted successfully')
    } catch (error: any) {
      // More specific error handling
      const errorMessage = error?.message || 'An unexpected error occurred'
      toast.error(
        `Failed to ${rollbackType === 'full' ? 'reset' : 'rollback'} table: ${errorMessage}`
      )
    } finally {
      setCurrentAction(null)
      setIsOpen(false)
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type="primary"
          size="tiny"
          loading={isLoading}
          disabled={isLoading}
          className="h-7 text-xs px-3"
          icon={<ChevronDown className="w-3 h-3" />}
          aria-label={`Fix table ${tableName}`}
        >
          Fix Table
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56" aria-label="Rollback options">
        {RETRY_OPTIONS.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={() => handleRollback(option.type)}
            disabled={isLoading}
            className="flex flex-col items-start px-3 py-2 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
            aria-describedby={`rollback-${option.type}-description`}
          >
            <div className="flex items-center gap-2 w-full">
              {option.icon}
              <span className="font-medium text-xs">
                {option.title}
                {currentAction === option.type && <span className="ml-1">(Processing...)</span>}
              </span>
            </div>
            <p
              id={`rollback-${option.type}-description`}
              className="text-xs text-foreground-light mt-1 leading-tight"
            >
              {option.description}
            </p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
