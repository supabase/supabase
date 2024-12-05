import { useParams } from 'common'
import { WorkflowLogsPage } from 'components/interfaces/BranchManagement/WorkflowLogs'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const WorkflowRunIdLogs: NextPageWithLayout = () => {
  const project = useSelectedProject()
  const { workflow_run_id } = useParams()
  if (!project?.ref) {
    return null
  }
  return <WorkflowLogsPage projectRef={project?.ref} workflowRunId={workflow_run_id} />
}

WorkflowRunIdLogs.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default WorkflowRunIdLogs
