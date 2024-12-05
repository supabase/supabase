import { useState } from 'react'

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
import { useWorkflowLogs } from "./useWorkflowLogs"
import { WorkflowLogsContent } from "./WorkflowLogsContent"

interface WorkflowLogsDialogProps {
    projectRef: string
}
  

export const WorkflowLogsDialog = ({ projectRef }: WorkflowLogsDialogProps) => {
    const [isOpen, setIsOpen] = useState(false)
    const workflowLogs = useWorkflowLogs(projectRef, isOpen)
  
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
            <WorkflowLogsContent
              {...workflowLogs}
              maxHeight={true}
              onSelectWorkflowRun={workflowLogs.setSelectedWorkflowRunId}
              onBack={() => workflowLogs.setSelectedWorkflowRunId(undefined)}
            />
          </DialogSection>
        </DialogContent>
      </Dialog>
    )
  }