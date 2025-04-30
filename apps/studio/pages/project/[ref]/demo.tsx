import DefaultLayout from 'components/layouts/DefaultLayout'
import LogsLayout from 'components/layouts/LogsLayout/LogsLayout'
import * as React from 'react'
import type { NextPageWithLayout } from 'types'
import { columns } from 'components/interfaces/DataTableDemo/default/columns'
import { filterFields } from 'components/interfaces/DataTableDemo/default/constants'
import { data } from 'components/interfaces/DataTableDemo/default/data'
import { DataTable } from 'components/interfaces/DataTableDemo/default/data-table'
import { Skeleton } from 'components/interfaces/DataTableDemo/default/skeleton'
import { useSearchParams } from 'components/interfaces/DataTableDemo/default/search-params'

export const LogPage: NextPageWithLayout = () => {
  const [search] = useSearchParams()

  return (
    <React.Suspense fallback={<Skeleton />}>
      <DataTable
        columns={columns}
        data={data}
        filterFields={filterFields}
        defaultColumnFilters={Object.entries(search)
          .map(([key, value]) => ({
            id: key,
            value,
          }))
          .filter(({ value }) => value ?? undefined)}
      />
    </React.Suspense>
  )
}

LogPage.getLayout = (page) => (
  <DefaultLayout>
    <LogsLayout hideSidebar={true}>{page}</LogsLayout>
  </DefaultLayout>
)

export default LogPage
