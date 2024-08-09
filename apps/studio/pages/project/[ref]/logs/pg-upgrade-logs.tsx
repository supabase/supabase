import { useRouter } from 'next/router'

import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return <LogsPreviewer condensedLayout queryType="pg_upgrade" projectRef={ref as string} />
}

LogPage.getLayout = (page) => <LogsLayout title="Database">{page}</LogsLayout>

export default LogPage
