import { useParams } from 'common'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, IconAlertCircle } from 'ui'

import { LogsTableName } from 'components/interfaces/Settings/Logs'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import { usePoolingConfigurationQuery } from 'data/database/pooling-configuration-query'
import { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const { data: poolingConfiguration } = usePoolingConfigurationQuery({
    projectRef: ref ?? 'default',
  })

  const isSupavisorEnabled =
    poolingConfiguration?.supavisor_enabled ??
    poolingConfiguration?.connectionString.includes('pooler.supabase.com') ??
    false

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.PGBOUNCER}
      queryType="pgbouncer"
    >
      {isSupavisorEnabled && (
        <div className="px-4 pt-4">
          <Alert_Shadcn_ variant="warning">
            <IconAlertCircle />
            <AlertTitle_Shadcn_>Supavisor logs are not available yet</AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              Your project currently has Supavisor enabled, which logs are currently unavailable.
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        </div>
      )}
    </LogsPreviewer>
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
