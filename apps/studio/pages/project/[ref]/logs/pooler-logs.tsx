import { parseAsString, useQueryState } from 'nuqs'

import { useParams } from 'common'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from 'components/interfaces/Settings/Logs/LogsPreviewer'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { useSupavisorConfigurationQuery } from 'data/database/supavisor-configuration-query'
import type { NextPageWithLayout } from 'types'
import { LogoLoader } from 'ui'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()
  const [identifier] = useQueryState('db', parseAsString)
  const { isPending: isLoading } = useSupavisorConfigurationQuery({ projectRef: ref ?? 'default' })

  // this prevents initial load of pooler logs before config has been retrieved
  if (isLoading) return <LogoLoader />

  return (
    <LogsPreviewer
      condensedLayout
      queryType="supavisor"
      projectRef={ref as string}
      tableName={LogsTableName.SUPAVISOR}
      filterOverride={!!identifier ? { identifier } : undefined}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Pooler Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
