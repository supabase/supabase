import { getQueryClient } from 'components/interfaces/DataTableDemo/providers/get-query-client'
// import { SearchParams } from 'nuqs' // No longer needed directly
import * as React from 'react'
import { Client } from 'components/interfaces/infinite-logs-example/client'
import { dataOptions } from 'components/interfaces/DataTableDemo/light/query-options'
import { searchParamsParser } from 'components/interfaces/DataTableDemo/light/search-params' // Import the parser
// import { useSearchParams } from 'next/navigation' // Switch to useQueryStates
import { useQueryStates } from 'nuqs' // Import useQueryStates

import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'

import type { NextPageWithLayout } from 'types'

export const LogPage: NextPageWithLayout = () => {
  // const searchParams = useSearchParams() // Replaced
  // const params = Object.fromEntries(searchParams.entries()) // Replaced
  // const search = searchParamsCache.parse(params) // Replaced
  const [search] = useQueryStates(searchParamsParser) // Use useQueryStates with the parser
  const queryClient = getQueryClient()

  React.useEffect(() => {
    // Pass the parsed search object directly to dataOptions
    queryClient.prefetchInfiniteQuery(dataOptions(search))
  }, [search, queryClient]) // Add queryClient to dependencies

  return <Client />
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
