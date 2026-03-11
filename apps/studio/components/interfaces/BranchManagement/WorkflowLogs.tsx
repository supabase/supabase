import dayjs from 'dayjs'
import { groupBy } from 'lodash'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useState } from 'react'

import AlertError from 'components/ui/AlertError'
import { ActionRunData } from 'data/actions/action-detail-query'
import { useActionRunLogsQuery } from 'data/actions/action-logs-query'
import {
  useActionsQuery,
  type ActionRunStep,
  type ActionStatus,
} from 'data/actions/action-runs-query'
import type { Branch } from 'data/branches/branches-query'
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
  StatusIcon,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns'
import { ActionStatusBadge, ActionStatusBadgeCondensed, STATUS_TO_LABEL } from './ActionStatusBadge'
import BranchStatusBadge from './BranchStatusBadge'

interface WorkflowLogsProps {
  projectRef: string
  status: Branch['status']
}

type StatusType = Branch['status']

const HEALTHY_STATUSES: StatusType[] = ['FUNCTIONS_DEPLOYED', 'MIGRATIONS_PASSED']
const UNHEALTHY_STATUSES: StatusType[] = ['MIGRATIONS_FAILED', 'FUNCTIONS_FAILED']

export const WorkflowLogs = ({ projectRef, status }: WorkflowLogsProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const {
    data: workflowRuns,
    isSuccess: isWorkflowRunsSuccess,
    isPending: isWorkflowRunsLoading,
    isError: isWorkflowRunsError,
    error: workflowRunsError,
  } = useActionsQuery({ ref: projectRef }, { enabled: isOpen })

  const [selectedWorkflowRun, setSelectedWorkflowRun] = useState<ActionRunData>()

  const {
    data: workflowRunLogs,
    isSuccess: isWorkflowRunLogsSuccess,
    isPending: isWorkflowRunLogsLoading,
    isError: isWorkflowRunLogsError,
    error: workflowRunLogsError,
  } = useActionRunLogsQuery(
    { projectRef, runId: selectedWorkflowRun?.id },
    { enabled: isOpen && Boolean(selectedWorkflowRun) }
  )

  const showStatusIcon = !HEALTHY_STATUSES.includes(status)
  const isUnhealthy = UNHEALTHY_STATUSES.includes(status)

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          type="default"
          icon={
            showStatusIcon ? (
              <StatusIcon variant={isUnhealthy ? 'destructive' : 'default'} hideBackground />
            ) : undefined
          }
          onClick={(e) => e.stopPropagation()}
        >
          View Logs
        </Button>
      </DialogTrigger>

      <DialogContent size="xlarge">
        <DialogHeader>
          <DialogTitle>Workflow Logs</DialogTitle>
          <DialogDescription>Select a workflow run to view logs</DialogDescription>
        </DialogHeader>

        <DialogSectionSeparator />

        <DialogSection className={cn('px-0', isWorkflowRunLogsSuccess ? 'py-0 pt-2' : '!py-0')}>
          {!selectedWorkflowRun ? (
            <>
              {isWorkflowRunsLoading && <GenericSkeletonLoader className="py-4" />}
              {isWorkflowRunsError && (
                <div className="py-4">
                  <AlertError error={workflowRunsError} />
                </div>
              )}
              {isWorkflowRunsSuccess &&
                (workflowRuns.length > 0 ? (
                  <ul className="divide-y">
                    {workflowRuns.map((workflowRun) => (
                      <li key={workflowRun.id} className="py-3">
                        <button
                          type="button"
                          disabled={workflowRun.id === projectRef}
                          onClick={() => setSelectedWorkflowRun(workflowRun)}
                          className="flex items-center gap-2 w-full justify-between"
                        >
                          <div className="flex items-center gap-4">
                            {workflowRun.run_steps.length > 0 ? (
                              <RunSteps steps={workflowRun.run_steps} />
                            ) : (
                              <BranchStatusBadge status={status} />
                            )}
                            <span className="text-sm">
                              {dayjs(workflowRun.created_at).format('DD MMM, YYYY HH:mm')}
                            </span>
                          </div>
                          {workflowRun.id !== projectRef && <ArrowRight size={16} />}
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
                onClick={() => setSelectedWorkflowRun(undefined)}
                type="text"
                icon={<ArrowLeft />}
                className="self-start"
              >
                Back to workflow runs
              </Button>

              {isWorkflowRunLogsLoading && <GenericSkeletonLoader className="py-2" />}
              {isWorkflowRunLogsError && (
                <div className="py-2">
                  <AlertError
                    className="rounded-none"
                    subject="Failed to retrieve workflow logs"
                    error={workflowRunLogsError}
                  />
                </div>
              )}
              {isWorkflowRunLogsSuccess && (
                <pre className="whitespace-pre max-h-[500px] overflow-scroll pb-5 text-sm">
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

function RunSteps({ steps }: { steps: Array<ActionRunStep> }) {
  const stepsByStatus = groupBy(steps, 'status') as Record<ActionStatus, Array<ActionRunStep>>
  const firstFailedStep = stepsByStatus.DEAD?.[0]
  const numberFailedSteps = stepsByStatus.DEAD?.length ?? 0

  return (
    <>
      {firstFailedStep && (
        <ActionStatusBadge name={firstFailedStep.name} status={firstFailedStep.status} />
      )}
      {numberFailedSteps > 1 && (
        <ActionStatusBadgeCondensed status={'DEAD'} details={stepsByStatus.DEAD.slice(1)}>
          {numberFailedSteps - 1} more
        </ActionStatusBadgeCondensed>
      )}
      {(Object.keys(stepsByStatus) as Array<ActionStatus>)
        .filter((status) => status !== 'DEAD')
        .map((status) => (
          <ActionStatusBadgeCondensed key={status} status={status} details={stepsByStatus[status]}>
            {stepsByStatus[status].length} {STATUS_TO_LABEL[status]}
          </ActionStatusBadgeCondensed>
        ))}
    </>
  )
}
