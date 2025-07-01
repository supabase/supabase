import { motion } from 'framer-motion'
import { CircleDotDashed, GitMerge, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

interface WorkflowRun {
  id: string
  status: string
  branch_id?: string
  check_run_id?: number | null
  created_at?: string
  updated_at?: string
  workdir?: string | null
  git_config?: unknown
}

interface WorkflowLogsCardProps {
  workflowRun: WorkflowRun | null | undefined
  logs: string | undefined
  isLoading?: boolean
  onClose?: () => void
  // Override props for failed workflows
  overrideTitle?: string
  overrideDescription?: string
  overrideIcon?: React.ReactNode
  overrideAction?: React.ReactNode
}

const WorkflowLogsCard = ({
  workflowRun,
  logs,
  isLoading = false,
  onClose,
  overrideTitle,
  overrideDescription,
  overrideIcon,
  overrideAction,
}: WorkflowLogsCardProps) => {
  const scrollRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to bottom when logs change
  useEffect(() => {
    if (scrollRef.current && logs) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const showSuccessIcon = workflowRun?.status === 'FUNCTIONS_DEPLOYED'
  const isFailed =
    workflowRun?.status && ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(workflowRun.status)
  const isPolling =
    workflowRun?.status !== 'FUNCTIONS_DEPLOYED' &&
    (!workflowRun?.status ||
      !['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(workflowRun.status))

  const displayTitle =
    overrideTitle ||
    (isPolling
      ? 'Processing...'
      : showSuccessIcon
        ? 'Workflow completed successfully'
        : isFailed
          ? 'Workflow failed'
          : 'Workflow completed')

  const displayIcon =
    overrideIcon ||
    (isPolling ? (
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <CircleDotDashed size={16} strokeWidth={1.5} className="text-warning" />
      </motion.div>
    ) : showSuccessIcon ? (
      <GitMerge size={16} strokeWidth={1.5} className="text-brand" />
    ) : null)

  return (
    <Card className="bg-background overflow-hidden h-64 flex flex-col">
      <CardHeader className={showSuccessIcon ? 'text-brand' : isFailed ? 'text-destructive' : ''}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {displayIcon}
            <div>
              <CardTitle className="text-sm font-medium">{displayTitle}</CardTitle>
              {overrideDescription && (
                <div className="text-sm text-foreground-light font-normal mt-0">
                  {overrideDescription}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {overrideAction}
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
        </div>
      </CardHeader>
      <CardContent
        ref={scrollRef}
        className="overflow-hidden border-0 overflow-y-auto relative p-0"
      >
        {/* sticky gradient overlay */}
        <div className="sticky top-0 -mb-8 h-8 bg-gradient-to-b from-background to-transparent pointer-events-none z-10" />
        {logs ? (
          <pre className="p-6 text-xs text-foreground-light p-0 rounded">{logs}</pre>
        ) : (
          <pre className="p-6 text-sm text-foreground-light rounded">
            {isLoading || isPolling ? 'Initializing workflow...' : 'Waiting for logs...'}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

export default WorkflowLogsCard
