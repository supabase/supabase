import { useState, useEffect } from 'react'

import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'
import { useWorkflowRunQuery } from 'data/workflow-runs/workflow-run-query'

interface UseWorkflowManagementProps {
  workflowRunId?: string
  projectRef?: string
  onWorkflowComplete?: (status: string) => void
}

export const useWorkflowManagement = ({
  workflowRunId,
  projectRef,
  onWorkflowComplete,
}: UseWorkflowManagementProps) => {
  const [hasRefetched, setHasRefetched] = useState(false)

  // Get workflow runs and logs
  const { data: workflowRuns } = useWorkflowRunsQuery(
    { projectRef },
    {
      enabled: Boolean(workflowRunId),
      refetchInterval: 3000,
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  const { data: workflowRunLogs } = useWorkflowRunQuery(
    { projectRef, workflowRunId },
    {
      refetchInterval: 2000,
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  // Find current workflow run
  const currentWorkflowRun = workflowRuns?.find((run) => run.id === workflowRunId)

  // Handle workflow completion
  useEffect(() => {
    if (!currentWorkflowRun?.status || !workflowRunId) return

    const isComplete = ['FUNCTIONS_DEPLOYED', 'MIGRATIONS_FAILED', 'FUNCTIONS_FAILED'].includes(
      currentWorkflowRun.status
    )

    // Only refetch once per workflow completion
    if (isComplete && !hasRefetched) {
      setHasRefetched(true)
      onWorkflowComplete?.(currentWorkflowRun.status)
    }
  }, [currentWorkflowRun?.status, workflowRunId, hasRefetched, onWorkflowComplete])

  // Reset refetch flag when workflow ID changes
  useEffect(() => {
    setHasRefetched(false)
  }, [workflowRunId])

  return {
    currentWorkflowRun,
    workflowRunLogs: workflowRunLogs?.logs,
  }
}
