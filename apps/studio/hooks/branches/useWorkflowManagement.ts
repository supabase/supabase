import { useEffect, useState } from 'react'

import { useActionRunQuery } from '@/data/actions/action-detail-query'
import { useActionRunLogsQuery } from '@/data/actions/action-logs-query'

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

  const { data: workflowRun } = useActionRunQuery(
    { projectRef, runId: workflowRunId },
    {
      refetchInterval: (query) => {
        return query.state.error?.code === 404 ? false : 2000
      },
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  const { data: workflowRunLogs } = useActionRunLogsQuery(
    { projectRef, runId: workflowRunId },
    {
      refetchInterval: (query) => {
        return query.state.error?.code === 404 ? false : 2000
      },
      refetchOnMount: 'always',
      staleTime: 0,
    }
  )

  // Handle workflow completion
  useEffect(() => {
    if (!workflowRun || !workflowRunId) return

    // Only refetch once per workflow completion
    if (!!workflowRun.status && workflowRun.status !== 'RUNNING' && !hasRefetched) {
      setHasRefetched(true)
      onWorkflowComplete?.(workflowRun.status)
    }
  }, [workflowRunId, hasRefetched, onWorkflowComplete, workflowRun])

  // Reset refetch flag when workflow ID changes
  useEffect(() => {
    setHasRefetched(false)
  }, [workflowRunId])

  return {
    run: workflowRun,
    logs: workflowRunLogs,
  }
}
