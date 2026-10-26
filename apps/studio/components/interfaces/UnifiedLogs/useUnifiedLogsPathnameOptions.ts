import { useDebounce } from '@uidotdev/usehooks'
import { useFeatureFlags, useParams } from 'common'
import { useState } from 'react'

import {
  columnFiltersToLogsFilters,
  isLogsFilterColumnValue,
  logsFiltersToUrlParams,
} from './UnifiedLogs.filters'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { Option } from '@/components/ui/DataTable/DataTable.types'
import { useDataTable } from '@/components/ui/DataTable/providers/DataTableProvider'
import { useUnifiedLogsFacetCountQuery } from '@/data/logs/unified-logs-facet-count-query'

export function useUnifiedLogsPathnameOptions(value: string, options?: Option[]) {
  const [inputValue, setInputValue] = useState('')
  const { ref: projectRef } = useParams()
  const { hasLoaded: flagsLoaded } = useFeatureFlags()
  const { table, searchParameters, columnFilters, filterFields, hasPendingFilterChange } =
    useDataTable<unknown, unknown, QuerySearchParamsType>()
  const debouncedSearch = useDebounce(inputValue, 700)

  const filterableNames = new Set(
    filterFields.filter((field) => field.type !== 'timerange').map((field) => String(field.value))
  )
  const dateValue = columnFilters.find((filter) => filter.id === 'date')?.value
  const date =
    Array.isArray(dateValue) &&
    dateValue.length === 2 &&
    dateValue.every((value) => value instanceof Date)
      ? dateValue
      : null
  const scopedSearch = hasPendingFilterChange
    ? {
        ...searchParameters,
        filter: logsFiltersToUrlParams(columnFiltersToLogsFilters(columnFilters, filterableNames)),
        date,
      }
    : searchParameters
  const {
    data: facetOptions,
    error,
    isPending,
    isError,
    isFetching,
  } = useUnifiedLogsFacetCountQuery(
    {
      projectRef,
      search: scopedSearch,
      facet: value,
      facetSearch: debouncedSearch,
    },
    { enabled: flagsLoaded }
  )

  const column = table.getColumn(value)
  const filterValue = columnFilters.find((filter) => filter.id === value)?.value
  const selectedValues = isLogsFilterColumnValue(filterValue) ? filterValue.values : []
  const visibleFacetOptions = inputValue === debouncedSearch ? (facetOptions ?? []) : []
  const selectedOptions = selectedValues.map(
    (selected) =>
      visibleFacetOptions.find((option) => option.value === selected) ??
      options?.find((option) => option.value === selected) ?? {
        label: selected,
        value: selected,
      }
  )
  const filterOptions = [
    ...selectedOptions,
    ...visibleFacetOptions.filter((option) => !selectedValues.includes(option.value)),
  ]

  return {
    column,
    error,
    filterOptions,
    inputValue,
    isError,
    isFetching,
    isLoading: !flagsLoaded || isPending || inputValue !== debouncedSearch,
    projectRef,
    selectedValues,
    setInputValue,
  }
}
