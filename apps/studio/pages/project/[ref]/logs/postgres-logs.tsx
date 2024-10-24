import { useRouter } from 'next/router'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      tableName={LogsTableName.POSTGRES}
      queryType={'database'}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Postgres Logs">{page}</LogsLayout>

export default LogPage
