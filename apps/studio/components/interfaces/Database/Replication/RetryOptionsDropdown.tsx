import { useState } from 'react'
import { ChevronDown, RotateCcw, Undo2 } from 'lucide-react'
import { toast } from 'sonner'

import { useStartPipelineMutation } from 'data/replication/start-pipeline-mutation'
import { RollbackType, useRollbackTableMutation } from 'data/replication/rollback-table-mutation'
import { Button, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

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
  
  const { mutateAsync: rollbackTable, isLoading: isRollingBack } = useRollbackTableMutation()
  const { mutateAsync: startPipeline, isLoading: isRestartingPipeline } = useStartPipelineMutation()
  
  const isLoading = isRollingBack || isRestartingPipeline

  const handleRollback = async (rollbackType: RollbackType) => {
    try {
      setIsOpen(false)
      
      const actionText = rollbackType === 'full' ? 'reset from scratch' : 'rolled back to previous state'
      
      // First rollback the table
      await rollbackTable({
        projectRef,
        pipelineId,
        tableId,
        rollbackType,
      })

      toast.success(`Table "${tableName}" ${actionText} successfully`)

      // Then restart the pipeline
      await startPipeline({ projectRef, pipelineId })
      toast.success('Pipeline restarted successfully')

    } catch (error) {
      console.error('Rollback failed:', error)
      toast.error('Failed to rollback table. Please try again.')
    }
  }

  const retryOptions = [
    {
      type: 'individual' as RollbackType,
      icon: <Undo2 className="w-3 h-3" />,
      title: 'Rollback to previous state',
      description: 'Restart from the last working state',
      action: () => handleRollback('individual'),
    },
    {
      type: 'full' as RollbackType,
      icon: <RotateCcw className="w-3 h-3" />,
      title: 'Reset from scratch',
      description: 'Completely restart the table replication',
      action: () => handleRollback('full'),
    },
  ]

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
        >
          Fix Table
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-56">
        {retryOptions.map((option) => (
          <DropdownMenuItem
            key={option.type}
            onClick={option.action}
            className="flex flex-col items-start px-3 py-2 cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {option.icon}
              <span className="font-medium text-xs">{option.title}</span>
            </div>
            <p className="text-xs text-foreground-light mt-1 leading-tight">
              {option.description}
            </p>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}