import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { useWorkflowRunLogsQuery } from 'data/workflow-runs/workflow-run-logs-query'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'
import dayjs from 'dayjs'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import BranchStatusBadge from './BranchStatusBadge'

interface WorkflowLogsProps {
  projectRef: string
}

const WorkflowLogs = ({ projectRef }: WorkflowLogsProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const {
    data: workflowRuns,
    isSuccess: isWorkflowRunsSuccess,
    isLoading: isWorkflowRunsLoading,
    isError: isWorkflowRunsError,
    error: workflowRunsError,
  } = useWorkflowRunsQuery(
    {
      projectRef,
    },
    {
      enabled: isOpen,
    }
  )

  const [selectedWorkflowRunId, setSelectedWorkflowRunId] = useState<string | undefined>(undefined)

  const {
    data: workflowRunLogs,
    isSuccess: isWorkflowRunLogsSuccess,
    isLoading: isWorkflowRunLogsLoading,
    isError: isWorkflowRunLogsError,
    error: workflowRunLogsError,
  } = useWorkflowRunLogsQuery(
    {
      workflowRunId: selectedWorkflowRunId,
    },
    {
      enabled: isOpen && selectedWorkflowRunId !== undefined,
    }
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button type="default">View Logs</Button>
      </DialogTrigger>

      <DialogContent size="xlarge">
        <DialogHeader>
          <DialogTitle>Workflow Logs</DialogTitle>

          <DialogDescription>Select a workflow run to view logs</DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className={cn('px-0', isWorkflowRunLogsSuccess ? 'py-0 pt-2' : '!py-0')}>
          {selectedWorkflowRunId === undefined ? (
            <>
              {isWorkflowRunsLoading && <GenericSkeletonLoader className="py-2 px-5" />}
              {isWorkflowRunsError && <AlertError error={workflowRunsError} />}
              {isWorkflowRunsSuccess &&
                (workflowRuns.length > 0 ? (
                  <ul className="divide-y">
                    {workflowRuns.map((workflowRun) => (
                      <li key={workflowRun.id} className="py-3 px-5">
                        <button
                          type="button"
                          onClick={() => setSelectedWorkflowRunId(workflowRun.id)}
                          className="flex items-center gap-2 w-full justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <BranchStatusBadge status={workflowRun.status} />
                            <span className="text-sm">
                              {dayjs(workflowRun.created_at).format('DD MMM, YYYY HH:mm')}
                            </span>
                          </div>
                          <ArrowRight size={16} />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm text-foreground-light py-4">
                    No workflow runs found.
                  </p>
                ))}
            </>
          ) : (
            <div className="flex flex-col gap-2 py-2">
              <Button
                onClick={() => setSelectedWorkflowRunId(undefined)}
                type="text"
                icon={<ArrowLeft />}
                className="self-start mx-5"
              >
                Back to workflow runs
              </Button>

              {isWorkflowRunLogsLoading && <GenericSkeletonLoader className="py-2 px-5" />}
              {isWorkflowRunLogsError && (
                <AlertError
                  className="rounded-none"
                  subject="Failed to retrieve workflow logs"
                  error={workflowRunLogsError}
                />
              )}
              {isWorkflowRunLogsSuccess && (
                <pre className="whitespace-pre max-h-[500px] overflow-scroll px-5 pb-5">
                  {workflowRunLogs}
                </pre>
              )}
            </div>
          )}
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowLogs
