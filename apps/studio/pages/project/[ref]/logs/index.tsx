import { useRouter } from 'next/router'
import { useEffect } from 'react'

import { useParams } from 'common'
import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const [lastVisitedLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    'explorer'
  )

  useEffect(() => {
    router.replace(`/project/${ref}/logs/${lastVisitedLogsPage}`)
  }, [router, lastVisitedLogsPage, ref])

  return null
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
