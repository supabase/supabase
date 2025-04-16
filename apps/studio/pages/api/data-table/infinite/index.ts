import { calculateSpecificPercentile } from 'components/interfaces/DataTableDemo/lib/request/percentile'
import { addDays } from 'date-fns'
import type { NextApiRequest, NextApiResponse } from 'next'
import SuperJSON from 'superjson'
import type {
  InfiniteQueryResponse,
  LogsMeta,
} from 'components/interfaces/DataTableDemo/infinite/query-options'
import type { ColumnSchema } from 'components/interfaces/DataTableDemo/infinite/schema'
import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
import {
  filterData,
  getFacetsFromData,
  groupChartData,
  percentileData,
  sliderFilterValues,
  sortData,
  splitData,
} from './helpers'
import { mock, mockLive } from './mock'
import { searchParamsParser } from 'components/interfaces/DataTableDemo/infinite/search-params'
import type { inferParserType } from 'nuqs'

type SearchParamsType = inferParserType<typeof searchParamsParser>

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    res.status(405).end(`Method ${req.method} Not Allowed`)
    return
  }

  const query = req.query

  // Parse the full search object to get defaults for pagination etc.
  const search = Object.fromEntries(
    Object.entries(searchParamsParser).map(([key, parser]) => {
      const queryValue = query[key]
      const value = Array.isArray(queryValue) ? queryValue[0] : queryValue
      const parsedValue = value !== undefined ? parser.parse(value) : parser.parse('')
      return [key, parsedValue]
    })
  ) as SearchParamsType

  // --- Build effectiveFilters ONLY from params present in the query --- //
  const effectiveFilters: Partial<SearchParamsType> = {}
  Object.keys(query).forEach((key) => {
    // Only include keys that are actual filters (not pagination/sort etc.)
    // and are defined in our parser
    if (
      key in searchParamsParser &&
      !['start', 'size', 'sort', 'direction', 'cursor', 'live'].includes(key)
    ) {
      // Use the fully parsed value (including defaults if needed for parsing logic)
      // but only if the key was actually in the query
      const parsedValue = search[key as keyof SearchParamsType]
      // Only assign if the value is not null (as Partial<> expects Type | undefined)
      if (parsedValue !== null) {
        effectiveFilters[key as keyof typeof effectiveFilters] = parsedValue
      }
    }
  })
  // --- End of effectiveFilters build --- //

  const totalData = [...mockLive, ...mock]

  // Handle date separately IF it was in the query
  const _date =
    search.date?.length === 1 ? [search.date[0], addDays(search.date[0], 1)] : search.date
  if (_date && effectiveFilters.date) {
    effectiveFilters.date = _date // Use the calculated range
  }

  // Single filtering step using only filters from the query
  const filteredData = filterData(totalData, effectiveFilters)

  // DEBUG:
  console.log('>>> [API] Filtered data length:', filteredData.length)

  // --- Calculate Date Range for Chart --- //
  let chartDateRange: Date[] | null = null
  const explicitDateFilter = effectiveFilters.date as Date[] | undefined
  if (explicitDateFilter && explicitDateFilter.length > 0) {
    // Use the explicit date filter if provided
    chartDateRange =
      explicitDateFilter.length === 1
        ? [explicitDateFilter[0], addDays(explicitDateFilter[0], 1)]
        : explicitDateFilter
  } else if (filteredData.length > 0) {
    // Otherwise, use the range from the filtered data
    const sortedByDate = [...filteredData].sort((a, b) => a.date.getTime() - b.date.getTime())
    chartDateRange = [sortedByDate[0].date, sortedByDate[sortedByDate.length - 1].date]
  }
  // If filteredData is empty and no explicit date, chartDateRange remains null
  // --- End Date Range Calculation --- //

  // REMINDER: We might still need the facets from data filtered *without* sliders
  //           if the UI sliders need the full min/max range.
  // const _rest = Object.fromEntries(
  //   Object.entries(search).filter(([key]) => !sliderFilterValues.includes(key as any))
  // )
  // const withoutSliderData = filterData(totalData, { ..._rest, date: _date })
  // const withoutSliderFacets = getFacetsFromData(withoutSliderData)

  // Calculate facets based on the final filtered data
  const facets = getFacetsFromData(filteredData)

  // Sort the filtered data
  const sortedData = sortData(filteredData, search.sort)

  // Calculate percentile for each row IN the filtered data
  const withPercentileData = percentileData(sortedData)

  // Paginate the sorted, percentile-annotated data
  const data = splitData(withPercentileData, search)

  // Calculate aggregate percentiles based on the filtered data (before pagination)
  const latencies = filteredData.map(({ latency }) => latency)
  const currentPercentiles = {
    50: calculateSpecificPercentile(latencies, 50),
    75: calculateSpecificPercentile(latencies, 75),
    90: calculateSpecificPercentile(latencies, 90),
    95: calculateSpecificPercentile(latencies, 95),
    99: calculateSpecificPercentile(latencies, 99),
  }

  const nextCursor = data.length > 0 ? data[data.length - 1].date.getTime() : null
  const prevCursor = data.length > 0 ? data[0].date.getTime() : new Date().getTime()

  const responsePayload = {
    data,
    meta: {
      totalRowCount: totalData.length,
      filterRowCount: filteredData.length,
      chartData: groupChartData(filteredData, chartDateRange),
      facets: {
        ...facets,
      },
      metadata: { currentPercentiles },
    },
    prevCursor,
    nextCursor,
  } satisfies InfiniteQueryResponse<ColumnSchema[], LogsMeta>

  res.setHeader('Content-Type', 'application/json')
  res.status(200).send(SuperJSON.stringify(responsePayload))
}
