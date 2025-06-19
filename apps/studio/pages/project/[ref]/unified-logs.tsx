import { useRouter } from 'next/router'

import { UnifiedLogs } from 'components/interfaces/UnifiedLogs/UnifiedLogs'
import DefaultLayout from 'components/layouts/DefaultLayout'
import UnifiedLogsLayout from 'components/layouts/UnifiedLogsLayout/UnifiedLogsLayout'
import { useProjectByRef } from 'hooks/misc/useSelectedProject'
import { useFlag } from 'hooks/ui/useFlag'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const unifiedLogsEnabled = useFlag('unifiedLogs')
  const { ref } = router.query

  // Redirect if flag is disabled
  if (unifiedLogsEnabled === false) {
    router.push(`/project/${ref}/logs`)
  }

  return <UnifiedLogs />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <UnifiedLogsLayout>{page}</UnifiedLogsLayout>
  </DefaultLayout>
)

export default LogPage
