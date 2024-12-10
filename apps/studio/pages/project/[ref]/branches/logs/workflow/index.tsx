import { useParams } from 'common'
import { WorkflowLogsPage } from 'components/interfaces/BranchManagement/WorkflowLogs'
import { ProjectLayoutWithAuth } from 'components/layouts/ProjectLayout/ProjectLayout'
import type { NextPageWithLayout } from 'types'

const WorkflowRunLogs: NextPageWithLayout = () => {
  const { ref } = useParams()
  if (!ref) {
    return null
  }
  return <WorkflowLogsPage projectRef={ref} />
}

WorkflowRunLogs.getLayout = (page) => <ProjectLayoutWithAuth>{page}</ProjectLayoutWithAuth>

export default WorkflowRunLogs
