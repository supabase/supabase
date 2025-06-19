import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import UnifiedLogsLayout from 'components/layouts/UnifiedLogsLayout/UnifiedLogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => <UnifiedLogs />

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <UnifiedLogsLayout>{page}</UnifiedLogsLayout>
  </DefaultLayout>
)

export default LogPage
