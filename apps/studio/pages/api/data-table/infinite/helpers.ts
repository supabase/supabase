import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { REGIONS } from 'components/interfaces/DataTableDemo/constants/region'
import { isArrayOfDates, isArrayOfNumbers } from 'components/interfaces/DataTableDemo/lib/is-array'
import {
  calculatePercentile,
  calculateSpecificPercentile,
} from 'components/interfaces/DataTableDemo/lib/request/percentile'
import { addDays, addMilliseconds, differenceInMinutes, isSameDay } from 'date-fns'
import type {
  ColumnSchema,
  FacetMetadataSchema,
  TimelineChartSchema,
} from 'components/interfaces/DataTableDemo/infinite/schema'
import type { SearchParamsType } from 'components/interfaces/DataTableDemo/infinite/search-params'

export const sliderFilterValues = [
  'latency',
  'timing.dns',
  'timing.connection',
  'timing.tls',
  'timing.ttfb',
  'timing.transfer',
] as const satisfies (keyof ColumnSchema)[]

export const filterValues = [
  'level',
  ...sliderFilterValues,
  'status',
  'regions',
  'method',
  'host',
  'pathname',
] as const satisfies (keyof ColumnSchema)[]

export function filterData(
  data: ColumnSchema[],
  search: Partial<SearchParamsType>
): ColumnSchema[] {
  return data.filter((row) => {
    for (const key in search) {
      const filter = search[key as keyof typeof search]

      if (filter === undefined || filter === null) continue

      if (
        (key === 'latency' ||
          key === 'timing.dns' ||
          key === 'timing.connection' ||
          key === 'timing.tls' ||
          key === 'timing.ttfb' ||
          key === 'timing.transfer') &&
        isArrayOfNumbers(filter) &&
        filter.length > 0
      ) {
        const rowValue = row[key as keyof ColumnSchema]
        if (typeof rowValue !== 'number') return false
        if (filter.length === 1 && rowValue !== filter[0]) return false
        if (filter.length === 2 && (rowValue < filter[0] || rowValue > filter[1])) return false
        continue
      }

      if (key === 'status' && isArrayOfNumbers(filter) && filter.length > 0) {
        const rowValue = row[key as 'status']
        if (typeof rowValue !== 'number') return false
        if (!filter.includes(rowValue)) return false
        continue
      }

      if (key === 'regions' && Array.isArray(filter) && filter.length > 0) {
        const rowRegions = row[key as 'regions']
        if (!Array.isArray(rowRegions) || rowRegions.length === 0) return false
        if (!(filter as string[]).includes(rowRegions[0])) return false
        continue
      }

      if (key === 'date' && isArrayOfDates(filter) && filter.length > 0) {
        const rowValue = row[key as 'date']
        if (!(rowValue instanceof Date)) return false
        const rowTimestamp = rowValue.getTime()
        if (filter.length === 1 && !isSameDay(rowValue, filter[0])) return false
        if (
          filter.length === 2 &&
          (rowTimestamp < filter[0].getTime() || rowTimestamp > filter[1].getTime())
        )
          return false
        continue
      }

      if (key === 'level' && Array.isArray(filter) && filter.length > 0) {
        const rowValue = row[key as 'level']
        if (typeof rowValue !== 'string') return false
        if (!(filter as string[]).includes(rowValue)) return false
        continue
      }

      if (key === 'host' && typeof filter === 'string' && filter.length > 0) {
        const rowValue = row[key as 'host']
        if (typeof rowValue !== 'string' || rowValue !== filter) return false
        continue
      }

      if (key === 'pathname' && typeof filter === 'string' && filter.length > 0) {
        const rowValue = row[key as 'pathname']
        if (typeof rowValue !== 'string' || rowValue !== filter) return false
        continue
      }
    }
    return true
  })
}

export function sortData(data: ColumnSchema[], sort: SearchParamsType['sort']) {
  if (!sort) return data
  return data.sort((a, b) => {
    if (sort.desc) {
      // @ts-ignore
      return a?.[sort.id] < b?.[sort.id] ? 1 : -1
    } else {
      // @ts-ignore
      return a?.[sort.id] > b?.[sort.id] ? 1 : -1
    }
  })
}

export function percentileData(data: ColumnSchema[]): ColumnSchema[] {
  const latencies = data.map((row) => row.latency)
  return data.map((row) => ({
    ...row,
    percentile: calculatePercentile(latencies, row.latency),
  }))
}

export function splitData(data: ColumnSchema[], search: SearchParamsType) {
  let newData: ColumnSchema[] = []
  const now = new Date()
  const cursorTimestamp = search.cursor.getTime()

  data.forEach((item) => {
    const itemTimestamp = item.date.getTime()

    if (search.direction === 'next') {
      // If item is older than cursor and we need more items
      if (itemTimestamp < cursorTimestamp && newData.length < search.size) {
        newData.push(item)
        // If item has the exact same timestamp as the last added item (to include ties)
      } else if (
        newData.length > 0 &&
        itemTimestamp === newData[newData.length - 1].date.getTime()
      ) {
        newData.push(item)
      }
    } else if (search.direction === 'prev') {
      // If item is newer than cursor and not in the future
      if (itemTimestamp > cursorTimestamp && itemTimestamp < now.getTime()) {
        newData.push(item)
      }
      // Note: For 'prev', we might need to sort in reverse and take size later
      // or handle it differently depending on desired behavior for ties.
      // Current logic fetches all newer items, potentially more than size.
    }
  })

  // For 'prev', ensure we only return the required size, potentially sorting again if order matters
  if (search.direction === 'prev') {
    // Assuming sortData handles default if search.sort is null
    const sortedPrevData = sortData(newData, search.sort)
    newData = sortedPrevData.slice(0, search.size) // Limit to size
  }

  return newData
}

export function getFacetsFromData(data: ColumnSchema[]) {
  const valuesMap = data.reduce((prev, curr) => {
    Object.entries(curr).forEach(([key, value]) => {
      if (filterValues.includes(key as any)) {
        // REMINDER: because regions is an array with a single value we need to convert to string
        // TODO: we should make the region a single string instead of an array?!?
        const _value = Array.isArray(value) ? value.toString() : value
        const total = prev.get(key)?.get(_value) || 0
        if (prev.has(key) && _value) {
          prev.get(key)?.set(_value, total + 1)
        } else if (_value) {
          prev.set(key, new Map([[_value, 1]]))
        }
      }
    })
    return prev
  }, new Map<string, Map<any, number>>())

  const facets = Object.fromEntries(
    Array.from(valuesMap.entries()).map(([key, valueMap]) => {
      let min: number | undefined
      let max: number | undefined
      const rows = Array.from(valueMap.entries()).map(([value, total]) => {
        if (typeof value === 'number') {
          if (!min) min = value
          else min = value < min ? value : min
          if (!max) max = value
          else max = value > max ? value : max
        }
        return {
          value,
          total,
        }
      })
      const total = Array.from(valueMap.values()).reduce((a, b) => a + b, 0)
      return [key, { rows, total, min, max }]
    })
  )

  return facets satisfies Record<string, FacetMetadataSchema>
}

export function getPercentileFromData(data: ColumnSchema[]) {
  const latencies = data.map((row) => row.latency)

  const p50 = calculateSpecificPercentile(latencies, 50)
  const p75 = calculateSpecificPercentile(latencies, 75)
  const p90 = calculateSpecificPercentile(latencies, 90)
  const p95 = calculateSpecificPercentile(latencies, 95)
  const p99 = calculateSpecificPercentile(latencies, 99)

  return { p50, p75, p90, p95, p99 }
}

export function groupChartData(data: ColumnSchema[], dates: Date[] | null): TimelineChartSchema[] {
  console.log(`>>> [groupChartData] Input data length: ${data?.length}, Input dates:`, dates)

  if (data?.length === 0 && !dates) {
    console.log('>>> [groupChartData] Returning [] due to empty data and no dates.')
    return []
  }

  const _dates = dates?.length === 1 ? [dates[0], addDays(dates[0], 1)] : dates
  const between = _dates || (data?.length ? [data[data.length - 1].date, data[0].date] : [])

  console.log(`>>> [groupChartData] Date range used ('between'):`, between)

  if (!between.length || !(between[0] instanceof Date) || !(between[1] instanceof Date)) {
    // Added validity check
    console.log(`>>> [groupChartData] Returning [] due to invalid 'between' range.`)
    return []
  }

  const interval = evaluateInterval(between)
  console.log(`>>> [groupChartData] Calculated interval (ms): ${interval}`)
  if (interval <= 0) {
    // Added check for valid interval
    console.log('>>> [groupChartData] Returning [] due to invalid interval.')
    return []
  }

  const duration = Math.abs(between[0].getTime() - between[between.length - 1].getTime())
  const steps = Math.floor(duration / interval)
  console.log(`>>> [groupChartData] Calculated steps: ${steps}`)
  if (steps <= 0) {
    // Added check for valid steps
    console.log('>>> [groupChartData] Returning [] due to zero steps.')
    return []
  }

  const timestamps: { date: Date }[] = []

  for (let i = 0; i < steps; i++) {
    const newTimestamp = addMilliseconds(between[0], i * interval)
    timestamps.push({ date: newTimestamp })
  }

  // TODO: make it dynamic to avoid havin 200, 400, 500 hardcoded
  // TODO: make it more efficient
  // e.g. make the "status" prop we use as T generic
  const result = timestamps.map((timestamp, i) => {
    const filteredData = data.filter((row) => {
      const diff = row.date.getTime() - timestamp.date.getTime()
      return diff < interval && diff >= 0
    })

    return {
      timestamp: timestamp.date.getTime(), // TODO: use date-fns and interval to determine the format
      success: filteredData.filter((row) => row.level === 'success').length,
      warning: filteredData.filter((row) => row.level === 'warning').length,
      error: filteredData.filter((row) => row.level === 'error').length,
    }
  })

  console.log(`>>> [groupChartData] Result length: ${result.length}`)
  return result
}

export function evaluateInterval(dates: Date[] | null): number {
  if (!dates) return 0
  if (dates.length < 1 || dates.length > 3) return 0

  // Calculate the time difference in minutes
  const timeDiffInMinutes = Math.abs(differenceInMinutes(dates[0], dates[1]))

  // Define thresholds and their respective intervals in milliseconds
  const intervals = [
    { threshold: 1, interval: 1000 }, // 1 second
    { threshold: 5, interval: 5000 }, // 5 seconds
    { threshold: 10, interval: 10000 }, // 10 seconds
    { threshold: 30, interval: 30000 }, // 30 seconds
    { threshold: 60, interval: 60000 }, // 1 minute
    { threshold: 120, interval: 120000 }, // 2 minutes
    { threshold: 240, interval: 240000 }, // 4 minutes
    { threshold: 480, interval: 480000 }, // 8 minutes
    { threshold: 1440, interval: 1440000 }, // 24 minutes
    { threshold: 2880, interval: 2880000 }, // 48 minutes
    { threshold: 5760, interval: 5760000 }, // 96 minutes
    { threshold: 11520, interval: 11520000 }, // 192 minutes
    { threshold: 23040, interval: 23040000 }, // 384 minutes
  ]

  // Iterate over the intervals and return the matching one
  for (const { threshold, interval } of intervals) {
    if (timeDiffInMinutes < threshold) {
      return interval
    }
  }

  // Default to the largest interval if no match found
  return 46080000 // 768 minutes
}
