import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => <UnifiedLogs />

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
