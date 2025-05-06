import TraceViewerClient from 'components/interfaces/Trace/trace-viewer-client'
// import { SearchParams } from 'nuqs' // No longer needed directly
// import { useSearchParams } from 'next/navigation' // Switch to useQueryStates

import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'

import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  return <TraceViewerClient />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
