import { motion } from 'framer-motion'
import { CircleDotDashed, GitMerge, X } from 'lucide-react'
import { useEffect, useRef } from 'react'

import { ActionRun } from '@/data/actions/action-detail-query'
import { Button, Card, CardContent, CardHeader, CardTitle } from 'ui'

interface WorkflowLogsCardProps {
  workflowRun: ActionRun | null | undefined
  logs: string | undefined
  isLoading?: boolean
  onClose?: () => void
  // Override props for failed workflows
  overrideTitle?: string
  overrideDescription?: string
  overrideIcon?: React.ReactNode
  overrideAction?: React.ReactNode
}

export const WorkflowLogsCard = ({
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

  const workflowRunStatus = workflowRun?.status
  const isSuccess = workflowRunStatus === 'SUCCESS'
  const isFailed = workflowRunStatus === 'FAILED'
  const isPolling = workflowRunStatus === 'RUNNING'

  const displayTitle =
    overrideTitle ||
    (isPolling
      ? 'Processing...'
      : isSuccess
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
    ) : isSuccess ? (
      <GitMerge size={16} strokeWidth={1.5} className="text-brand" />
    ) : null)

  return (
    <Card className="bg-background overflow-hidden h-64 flex flex-col">
      <CardHeader className={isSuccess ? 'text-brand' : isFailed ? 'text-destructive' : ''}>
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
