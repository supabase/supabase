import { useParams } from 'common'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { useWorkflowRunsQuery } from 'data/workflow-runs/workflow-runs-query'
import type { NextPageWithLayout } from 'types'

export const WorkflowRunLogs: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  const stuff = useWorkflowRunsQuery({ projectRef })
  console.log('stuff:', stuff)

  return (
    <LogsPreviewer
      projectRef={projectRef as string}
      condensedLayout={true}
      // @ts-ignore
      tableName={'realtime_logs'}
      queryType={'realtime'}
    />
  )
}

WorkflowRunLogs.getLayout = (page) => <LogsLayout title="Workflow Run">{page}</LogsLayout>

export default WorkflowRunLogs
