import { useParams } from 'common'

import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { NextPageWithLayout } from 'types'
import Connecting from 'components/ui/Loading/Loading'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data: poolingConfiguration, isLoading } = usePoolingConfigurationQuery({
    projectRef: ref ?? 'default',
  })

  // this prevents initial load of pgbouncer logs before config has been retrieved
  if (isLoading) {
    return <Connecting />
  }
  const isSupavisorEnabled = poolingConfiguration?.supavisor_enabled ?? false

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={isSupavisorEnabled ? LogsTableName.SUPAVISOR : LogsTableName.PGBOUNCER}
      queryType={isSupavisorEnabled ? 'supavisor' : 'pgbouncer'}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
