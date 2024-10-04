import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { useWorkflowRunLogsQuery } from 'data/workflow-runs/workflow-run-logs-query'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'
import {
  Button,
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

        <DialogSection>
          {selectedWorkflowRunId === undefined ? (
            <>
              {isWorkflowRunsLoading && <GenericSkeletonLoader />}
              {isWorkflowRunsError && <AlertError error={workflowRunsError} />}
              {isWorkflowRunsSuccess &&
                (workflowRuns.length > 0 ? (
                  <ul>
                    {workflowRuns.map((workflowRun) => (
                      <li key={workflowRun.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedWorkflowRunId(workflowRun.id)}
                        >
                          {workflowRun.id}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-center text-sm text-foreground-light">
                    No workflow runs found.
                  </p>
                ))}
            </>
          ) : (
            <>
              {isWorkflowRunLogsLoading && <GenericSkeletonLoader />}
              {isWorkflowRunLogsError && <AlertError error={workflowRunLogsError} />}
              {isWorkflowRunLogsSuccess && <pre>{workflowRunLogs}</pre>}
            </>
          )}
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}

export default WorkflowLogs
