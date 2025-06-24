import React from 'react'
import { Card, CardHeader, CardContent, CardTitle, Button } from 'ui'
import { motion } from 'framer-motion'
import { CircleDotDashed, GitMerge, X } from 'lucide-react'
import Link from 'next/link'
import { useWorkflowRunQuery } from 'data/workflow-runs/workflow-run-query'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'

interface WorkflowLogsCardProps {
  workflowRunId: string
  projectRef: string
  onClose?: () => void
  onStatusChange?: (status: string, workflowRunId: string) => void
  statusComplete?: string // Status that indicates completion (e.g., 'FUNCTIONS_DEPLOYED')
  statusFailed?: string[] // Statuses that indicate failure (e.g., ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'])
}

const WorkflowLogsCard: React.FC<WorkflowLogsCardProps> = ({
  workflowRunId,
  projectRef,
  onClose,
  onStatusChange,
  statusComplete = 'FUNCTIONS_DEPLOYED',
  statusFailed = ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'],
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Get workflow runs for the specified project to find the workflow run
  const { data: workflowRuns } = useWorkflowRunsQuery(
    { projectRef },
    {
      enabled: !!projectRef,
      refetchInterval: 3000, // Always poll
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0,
    }
  )

  // Find the current workflow run
  const currentWorkflowRun = React.useMemo(() => {
    if (!workflowRunId) return null
    return workflowRuns?.find((run) => run.id === workflowRunId)
  }, [workflowRuns, workflowRunId])

  // Query for workflow run logs with continuous polling
  const { data: workflowRunLogs } = useWorkflowRunQuery(
    { workflowRunId },
    {
      enabled: !!workflowRunId,
      refetchInterval: 2000, // Always poll every 2 seconds
      refetchOnMount: 'always',
      refetchOnWindowFocus: true,
      staleTime: 0, // Always fetch fresh data
    }
  )

  // Auto-scroll to bottom when logs change
  React.useEffect(() => {
    if (scrollRef.current && workflowRunLogs?.logs) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [workflowRunLogs?.logs])

  // Call onStatusChange when status changes
  React.useEffect(() => {
    if (currentWorkflowRun?.status && onStatusChange) {
      onStatusChange(currentWorkflowRun.status, workflowRunId)
    }
  }, [currentWorkflowRun?.status, onStatusChange, workflowRunId])

  const showSuccessIcon = currentWorkflowRun?.status === statusComplete
  const isFailed = currentWorkflowRun?.status && statusFailed.includes(currentWorkflowRun.status)
  const isPolling =
    currentWorkflowRun?.status !== statusComplete &&
    (!currentWorkflowRun?.status || !statusFailed.includes(currentWorkflowRun.status))

  return (
    <Card className="my-6 bg-background overflow-hidden h-64 flex flex-col">
      <CardHeader className={showSuccessIcon ? 'text-brand' : isFailed ? 'text-warning' : ''}>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {/* Activity / success indicator */}
            {isPolling ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <CircleDotDashed size={16} strokeWidth={1.5} className="text-warning" />
              </motion.div>
            ) : (
              showSuccessIcon && <GitMerge size={16} strokeWidth={1.5} className="text-brand" />
            )}
            {/* Status text */}
            {isPolling
              ? 'Processing...'
              : showSuccessIcon
                ? 'Workflow completed successfully'
                : isFailed
                  ? 'Workflow failed'
                  : 'Workflow completed'}
          </CardTitle>
          {currentWorkflowRun?.id && (
            <div className="flex items-center gap-2">
              <div className="text-xs text-foreground-light">#{currentWorkflowRun.id}</div>
              {onClose && (
                <Button
                  type="text"
                  size="tiny"
                  icon={<X size={12} strokeWidth={1.5} />}
                  onClick={onClose}
                  className="h-5 w-5 p-0"
                />
              )}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent
        ref={scrollRef}
        className="overflow-hidden border-0 overflow-y-auto relative p-0"
      >
        {/* sticky gradient overlay */}
        <div className="sticky top-0 -mb-8 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
        {workflowRunLogs?.logs ? (
          <pre className="p-6 text-xs text-foreground-light p-0 rounded">
            {workflowRunLogs.logs}
          </pre>
        ) : (
          <pre className="p-6 text-sm text-foreground-light rounded">
            {isPolling ? 'Initializing workflow...' : 'Waiting for logs...'}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowLogsCard
