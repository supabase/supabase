import { useRouter } from 'next/router'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import type { NextPageWithLayout } from 'types'
import { LogsTableName } from 'components/interfaces/Settings/Logs'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      condensedLayout
      queryType="api"
      projectRef={ref as string}
      tableName={LogsTableName.EDGE}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
