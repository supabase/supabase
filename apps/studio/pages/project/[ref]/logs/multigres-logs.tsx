import { useParams } from 'common'

import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  return (
    <LogsPreviewer
      condensedLayout
      queryType="multigres"
      projectRef={ref as string}
      tableName={LogsTableName.MULTIGRES}
    />
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Multigres Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
