import * as React from 'react'
import { columns } from './columns'
import { filterFields } from './constants'
import { data } from './data'
import { DataTable } from './data-table'
import { useSearchParams } from './search-params'
import { Skeleton } from './skeleton'

export default function TableDemo() {
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
