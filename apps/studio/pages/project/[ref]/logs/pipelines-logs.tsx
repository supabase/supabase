import { useParams } from 'common'

import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import { DefaultLayout } from '@/components/layouts/DefaultLayout'
import LogsLayout from '@/components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from '@/types'

export const LogPage: NextPageWithLayout = () => {
  const { ref } = useParams()

  return <LogsPreviewer condensedLayout queryType="pipelines" projectRef={ref!} />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout title="Pipelines Logs">{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
