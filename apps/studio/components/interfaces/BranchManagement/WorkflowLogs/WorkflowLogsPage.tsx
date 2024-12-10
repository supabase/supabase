import { useRouter } from "next/router"
import { useWorkflowLogs } from "./useWorkflowLogs"
import { WorkflowLogsContent } from "./WorkflowLogsContent"

interface WorkflowLogsPageProps {
    projectRef: string
    workflowRunId?: string
}
  

export const WorkflowLogsPage = ({ projectRef, workflowRunId }: WorkflowLogsPageProps) => {
    const router = useRouter()
    const workflowLogs = useWorkflowLogs(projectRef, true, workflowRunId)
  
    return (
      <div className="flex flex-col p-5">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm text-foreground">Workflow Logs</h3>
        <p className="text-sm text-foreground-light">Select a workflow run to view its execution logs</p>
      </div>
      <div className="border-t my-4" />
        <WorkflowLogsContent
          {...workflowLogs}
          onSelectWorkflowRun={(id) => router.push(`/project/${projectRef}/branches/logs/workflow/${id}`)}
          onBack={() => router.push(`/project/${projectRef}/branches/logs/workflow`)}
        />
      </div>
    )
  }