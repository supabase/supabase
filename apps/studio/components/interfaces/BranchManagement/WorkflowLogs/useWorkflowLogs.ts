import { useState } from 'react'
import { useWorkflowRunLogsQuery } from 'data/workflow-runs/workflow-run-logs-query'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'

export const useWorkflowLogs = (projectRef: string, isOpen: boolean, workflowRunId?: string) => {
  const [selectedWorkflowRunId, setSelectedWorkflowRunId] = useState<string | undefined>(workflowRunId)

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

  return {
    workflowRuns,
    isWorkflowRunsSuccess,
    isWorkflowRunsLoading,
    isWorkflowRunsError,
    workflowRunsError,
    workflowRunLogs,
    isWorkflowRunLogsSuccess,
    isWorkflowRunLogsLoading,
    isWorkflowRunLogsError,
    workflowRunLogsError,
    selectedWorkflowRunId,
    setSelectedWorkflowRunId,
  }
}

export type UseWorkflowLogsType = ReturnType<typeof useWorkflowLogs>