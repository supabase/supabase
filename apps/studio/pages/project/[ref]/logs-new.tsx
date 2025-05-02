import { getQueryClient } from 'components/interfaces/DataTableDemo/providers/get-query-client'
// import { SearchParams } from 'nuqs' // No longer needed directly
import * as React from 'react'
import { Client } from 'components/interfaces/logs-new/client'
import { dataOptions } from 'components/interfaces/logs-new/query-options-new'
import { searchParamsParser } from 'components/interfaces/logs-new/search-params' // Import the parser
// import { useSearchParams } from 'next/navigation' // Switch to useQueryStates
import { useQueryStates } from 'nuqs' // Import useQueryStates

import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'

import type { NextPageWithLayout } from 'types'
import { useParams } from 'common'

export const LogPage: NextPageWithLayout = () => {
  const { ref: projectRef } = useParams()
  // const searchParams = useSearchParams() // Replaced
  // const params = Object.fromEntries(searchParams.entries()) // Replaced
  // const search = searchParamsCache.parse(params) // Replaced
  const [search] = useQueryStates(searchParamsParser) // Use useQueryStates with the parser
  const queryClient = getQueryClient()

  // Remove prefetching to avoid duplicate requests
  // React.useEffect(() => {
  //   // Pass the parsed search object directly to dataOptions
  //   queryClient.prefetchInfiniteQuery(dataOptions(search, projectRef ?? ''))
  // }, [search, queryClient, projectRef]) // Add queryClient and projectRef to dependencies

  return <Client />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
