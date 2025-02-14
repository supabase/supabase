import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import type { NextPageWithLayout } from 'types'
import DefaultLayout from 'components/layouts/DefaultLayout'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { LOCAL_STORAGE_KEYS } from 'lib/constants'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useParams } from 'common'
export const LogPage: NextPageWithLayout = () => {
  const router = useRouter()
  const { ref } = useParams()

  const [lastVisitedLogsPage, setLastVisitedLogsPage] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LAST_VISITED_LOGS_PAGE,
    ''
  )

  useEffect(() => {
    if (lastVisitedLogsPage) {
      router.replace(`/project/${ref}/logs/${lastVisitedLogsPage}`)
    } else {
      router.replace(`/project/${ref}/logs/explorer`)
    }
  }, [router, lastVisitedLogsPage, ref])

  return <div></div>
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
