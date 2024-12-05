import AlertError from "components/ui/AlertError"
import { Button, cn } from "ui"
import { GenericSkeletonLoader } from "ui-patterns"
import BranchStatusBadge from "../BranchStatusBadge"
import { ArrowLeft, ArrowRight } from "lucide-react"
import dayjs from "dayjs"
import { UseWorkflowLogsType } from "./useWorkflowLogs"

interface WorkflowLogsContentProps {
    workflowRuns: UseWorkflowLogsType['workflowRuns']
    isWorkflowRunsSuccess: boolean
    isWorkflowRunsLoading: boolean
    isWorkflowRunsError: boolean
    workflowRunsError: UseWorkflowLogsType['workflowRunsError']
    workflowRunLogs: string | undefined
    isWorkflowRunLogsSuccess: boolean
    isWorkflowRunLogsLoading: boolean
    isWorkflowRunLogsError: boolean
    workflowRunLogsError: UseWorkflowLogsType['workflowRunLogsError']
    selectedWorkflowRunId: string | undefined
    onSelectWorkflowRun: (id: string | undefined) => void
    onBack: () => void
    maxHeight?: boolean
  }
  
  export const WorkflowLogsContent = ({
    workflowRuns = [],
    isWorkflowRunsSuccess,
    isWorkflowRunsLoading,
    isWorkflowRunsError,
    workflowRunsError,
    workflowRunLogs = '',
    isWorkflowRunLogsSuccess,
    isWorkflowRunLogsLoading,
    isWorkflowRunLogsError,
    workflowRunLogsError,
    selectedWorkflowRunId,
    onSelectWorkflowRun,
    onBack,
    maxHeight
  }: WorkflowLogsContentProps) => {
    return (
      <div className={cn('px-0', isWorkflowRunLogsSuccess ? 'py-0 pt-2' : '!py-0')}>
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
                        onClick={() => onSelectWorkflowRun(workflowRun.id)}
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
              onClick={onBack}
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
              <pre className={`whitespace-pre ${maxHeight ? "max-h-[500px]" : ''} overflow-scroll px-5 pb-5`}>
                {workflowRunLogs}
              </pre>
            )}
          </div>
        )}
      </div>
    )
  }