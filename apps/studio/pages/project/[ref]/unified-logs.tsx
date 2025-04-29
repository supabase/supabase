import { useRouter } from 'next/router'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import UnifiedLogsPreviewer from 'components/interfaces/UnifiedLogs/UnifiedLogsPreviewer'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = router.query

  return <UnifiedLogsPreviewer condensedLayout projectRef={ref as string} />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
