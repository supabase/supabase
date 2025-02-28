import { IS_PLATFORM, useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { Loading } from 'components/ui/Loading'
import { usePgbouncerStatusQuery } from 'data/database/pgbouncer-status-query'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  const { data: pgBouncerStatus, isLoading: pgBouncerLoading } = usePgbouncerStatusQuery({
    projectRef: ref ?? 'default',
  })
  const { isLoading } = useSupavisorConfigurationQuery({ projectRef: ref ?? 'default' })

  // this prevents initial load of pooler logs before config has been retrieved
  if (pgBouncerLoading || isLoading) return <Loading />

  function getPoolerTable() {
    if (!IS_PLATFORM) {
      return LogsTableName.PGBOUNCER
    }

    if (pgBouncerStatus?.active) {
      return LogsTableName.PGBOUNCER
    }

    return LogsTableName.SUPAVISOR
  }

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={getPoolerTable()}
      queryType={'supavisor'}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Pooler Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
