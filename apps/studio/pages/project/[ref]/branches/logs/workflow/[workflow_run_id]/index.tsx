import { useParams } from 'common'
import { WorkflowLogsPage } from 'components/interfaces/BranchManagement/WorkflowLogs'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import type { NextPageWithLayout } from 'types'

const WorkflowRunIdLogs: NextPageWithLayout = () => {
  const { ref, workflow_run_id } = useParams()
  if (!ref) {
    return null
  }
  return <WorkflowLogsPage projectRef={ref} workflowRunId={workflow_run_id} />
}

WorkflowRunIdLogs.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default WorkflowRunIdLogs
