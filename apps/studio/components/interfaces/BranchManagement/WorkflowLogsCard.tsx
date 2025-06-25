import React from 'react'
import { Card, CardHeader, CardContent, CardTitle } from 'ui'
import { motion } from 'framer-motion'
import { CircleDotDashed, GitMerge } from 'lucide-react'
import Link from 'next/link'

interface WorkflowLogsCardProps {
  attemptedMerge: boolean
  isMerging: boolean
  isPolling: boolean
  currentWorkflowRun?: {
    status?: string
    id?: string
  } | null
  workflowRunLogs?: {
    logs?: string
  } | null
  mainBranchRef?: string
}

const WorkflowLogsCard: React.FC<WorkflowLogsCardProps> = ({
  attemptedMerge,
  isMerging,
  isPolling,
  currentWorkflowRun,
  workflowRunLogs,
  mainBranchRef,
}) => {
  const scrollRef = React.useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when logs change
  React.useEffect(() => {
    if (scrollRef.current && workflowRunLogs?.logs) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [workflowRunLogs?.logs])

  // Only show the card when the merge is in progress or has been attempted previously
  if (!isMerging && !attemptedMerge) return null

  const showSuccessIcon = currentWorkflowRun?.status === 'FUNCTIONS_DEPLOYED'

  return (
    <Card className="my-6 bg-background overflow-hidden h-64 flex flex-col">
      <CardHeader
        className={
          showSuccessIcon
            ? 'text-brand'
            : currentWorkflowRun?.status === 'MIGRATIONS_FAILED' ||
                currentWorkflowRun?.status === 'FUNCTIONS_FAILED'
              ? 'text-warning'
              : ''
        }
      >
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3">
            {/* Activity / success indicator */}
            {isPolling || isMerging ? (
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
            {isPolling || isMerging
              ? 'Merging...'
              : showSuccessIcon
                ? 'Branch successfully merged'
                : 'Branch failed to merge'}
          </CardTitle>
          {currentWorkflowRun?.id && (
            <div className="text-xs text-foreground-light">#{currentWorkflowRun.id}</div>
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
            {showSuccessIcon && <span className="text-brand">Merge complete</span>}
          </pre>
        ) : (
          <pre className="p-6 text-sm text-foreground-light rounded">
            {isMerging
              ? 'Merge started - initializing workflow...'
              : isPolling
                ? 'Initializing merge workflow...'
                : 'Waiting for logs...'}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowLogsCard
