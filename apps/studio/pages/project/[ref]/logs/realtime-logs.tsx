import { useRouter } from 'next/router'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { LogsLayout } from 'components/layouts'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return (
    <LogsPreviewer
      projectRef={ref as string}
      condensedLayout={true}
      // @ts-ignore
      tableName={'realtime_logs'}
      queryType={'realtime'}
    />
  )
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
