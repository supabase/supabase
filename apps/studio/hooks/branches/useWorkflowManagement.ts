import { useEffect, useState } from 'react'

import { useWorkflowRunLogsQuery } from '@/data/workflow-runs/workflow-run-logs-query'
import { useWorkflowRunQuery } from '@/data/workflow-runs/workflow-run-query'

interface UseWorkflowManagementProps {
  workflowRunId?: string
  projectRef?: string
  onWorkflowComplete?: (status: 'SUCCESS' | 'FAILED') => void
}

export const useWorkflowManagement = ({
  workflowRunId,
  projectRef,
  onWorkflowComplete,
}: UseWorkflowManagementProps) => {
  const [hasRefetched, setHasRefetched] = useState(false)

  const { data: workflowRun } = useWorkflowRunQuery(
    { projectRef, workflowRunId },
    {
      enabled: Boolean(workflowRunId),
      refetchInterval: 2000,
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  const { data: workflowRunLogs } = useWorkflowRunLogsQuery(
    { projectRef, workflowRunId },
    {
      refetchInterval: 2000,
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  // Handle workflow completion
  useEffect(() => {
    if (!workflowRun || !workflowRunId) return

    // Only refetch once per workflow completion
    if (workflowRun.status !== 'RUNNING' && !hasRefetched) {
      setHasRefetched(true)
      onWorkflowComplete?.(workflowRun.status)
    }
  }, [workflowRunId, hasRefetched, onWorkflowComplete, workflowRun])

  // Reset refetch flag when workflow ID changes
  useEffect(() => {
    setHasRefetched(false)
  }, [workflowRunId])

  return {
    workflowRun,
    workflowRunLogs: workflowRunLogs?.logs,
  }
}
