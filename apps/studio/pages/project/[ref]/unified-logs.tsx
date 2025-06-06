import { UnifiedLogsTable } from 'components/interfaces/UnifiedLogs/client'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => <UnifiedLogsTable />

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
