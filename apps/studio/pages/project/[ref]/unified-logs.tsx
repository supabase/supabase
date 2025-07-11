import { useRouter } from 'next/router'

import { useParams } from 'common'
import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import UnifiedLogsLayout from 'components/layouts/UnifiedLogsLayout/UnifiedLogsLayout'
import { useFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  // Always redirect to main logs page - unified logs are now shown there when flag is enabled
  router.push(`/project/${ref}/logs`)

  return null
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <UnifiedLogsLayout>{page}</UnifiedLogsLayout>
  </DefaultLayout>
)

export default LogPage
