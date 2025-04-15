'use client'

import { getLevelRowClassName } from 'components/interfaces/DataTableDemo/lib/request/level'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useQueryStates } from 'nuqs'
import * as React from 'react'
import {
  getFacetedMinMaxValues,
  getFacetedUniqueValues,
} from 'components/interfaces/DataTableDemo/infinite/client'
import { DataTableInfinite } from 'components/interfaces/DataTableDemo/infinite/data-table-infinite'
import { columns } from './columns'
import { filterFields as defaultFilterFields, sheetFields } from './constants'
import { dataOptions } from './query-options'
import { searchParamsParser } from './search-params'

export function Client() {
  const [search] = useQueryStates(searchParamsParser)
  const { data, isFetching, isLoading, fetchNextPage, hasNextPage, refetch } = useInfiniteQuery(
    dataOptions(search)
  )

  const flatData = React.useMemo(
    () => data?.pages?.flatMap((page) => page.data ?? []) ?? [],
    [data?.pages]
  )

  const lastPage = data?.pages?.[data?.pages.length - 1]
  const firstPage = data?.pages?.[0]
  const totalDBRowCount = lastPage?.meta?.totalRowCount
  const filterDBRowCount = firstPage?.meta?.filterRowCount
  const metadata = lastPage?.meta?.metadata
  const chartData = lastPage?.meta?.chartData
  const facets = lastPage?.meta?.facets
  const totalFetched = flatData?.length

  const { sort, cursor, direction, uuid, ...filter } = search

  // TODO: replace completely by facets
  const filterFields = React.useMemo(() => {
    return defaultFilterFields.map((field) => {
      const facet = facets?.[field.value]
      if (facet) {
        // TODO: facets
        if (['status', 'method'].includes(field.value)) {
          field.options = facet.rows.map((row) => ({
            value: row.value,
            label: row.value,
          }))
        }
        if (field.value === 'latency') {
          field.min = facet.min || field.min
          field.max = facet.max || field.max
          field.options = facet.rows.map((row) => ({
            value: row.value,
            label: row.value,
          }))
        }
      }
      return field
    })
  }, [flatData])

  const defaultColumnFilters = React.useMemo(() => {
    return Object.entries(filter)
      .map(([key, value]) => ({
        id: key,
        value,
      }))
      .filter(({ value }) => value ?? undefined)
  }, [filter])

  return (
    <DataTableInfinite
      columns={columns}
      data={flatData}
      totalRows={totalDBRowCount}
      filterRows={filterDBRowCount}
      totalRowsFetched={totalFetched}
      defaultColumnFilters={defaultColumnFilters}
      defaultColumnSorting={sort ? [sort] : undefined}
      getRowClassName={(row) => getLevelRowClassName(row.original.level)}
      getRowId={(row) => `${row.region}-${row.timestamp}-${row.url}-${row.latency}`}
      meta={metadata}
      chartData={chartData}
      chartDataColumnId="timestamp"
      filterFields={filterFields}
      sheetFields={sheetFields}
      isFetching={isFetching}
      isLoading={isLoading}
      getFacetedUniqueValues={getFacetedUniqueValues(facets)}
      getFacetedMinMaxValues={getFacetedMinMaxValues(facets)}
      fetchNextPage={fetchNextPage}
      hasNextPage={hasNextPage}
      // NOTE: we are not using live mode
      fetchPreviousPage={undefined}
      refetch={refetch}
      renderSheetTitle={(props) => props.row?.original.url}
      searchParamsParser={searchParamsParser}
    />
  )
}
