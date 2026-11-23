// select * from cron.job_run_details where jobid = '1' order by start_time desc limit 10

import { createFileRoute } from '@tanstack/react-router'
import { useParams } from 'common'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'

export const Route = createFileRoute('/project/$ref/logs/cron-logs')({
  component: LogPage,
  staticData: { logsLayoutTitle: 'Cron Logs' },
})

function LogPage() {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.PG_CRON}
      queryType={'pg_cron'}
    />
  )
}
