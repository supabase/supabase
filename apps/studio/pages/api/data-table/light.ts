import type { NextApiRequest, NextApiResponse } from 'next'
import { InfiniteQueryResponse } from 'components/interfaces/DataTableDemo/infinite/query-options'
import type {
  BaseChartSchema,
  FacetMetadataSchema,
} from 'components/interfaces/DataTableDemo/infinite/schema'
import { differenceInMinutes, subDays } from 'date-fns'
import SuperJSON from 'superjson'
import type { ColumnType } from 'components/interfaces/DataTableDemo/light/columns'
import { LEVELS } from 'components/interfaces/DataTableDemo/constants/levels'
import { METHODS } from 'components/interfaces/DataTableDemo/constants/method'
import { VERCEL_EDGE_REGIONS } from 'components/interfaces/DataTableDemo/constants/region'

// Assuming LEVELS, METHODS, VERCEL_EDGE_REGIONS might need `as const` where defined
// Example: export const LEVELS = [...] as const;

type _TemporalFacetsType = {
  facet: string
  value: string
  count: number
}

type Level = (typeof LEVELS)[number]
type Method = (typeof METHODS)[number]
type Region = (typeof VERCEL_EDGE_REGIONS)[number]

type ParsedSearchParams = {
  level?: Level[]
  status?: [number, number] // Explicitly [start, end]
  method?: Method[]
  region?: Region[]
  latency?: [number, number] // Explicitly [start, end]
  timestamp?: [Date, Date] // Explicitly [start, end]
  url?: string
  sort?: { id: string; desc: boolean }
  cursor?: Date
  direction?: 'prev' | 'next'
  uuid?: string
}

const PAGE_SIZE = 100
const VERCEL_EDGE_PING_URL = 'https://light.openstatus.dev'

const safeParseInt = (value: string | string[] | undefined): number | undefined => {
  if (typeof value !== 'string') return undefined
  const parsed = parseInt(value, 10)
  return isNaN(parsed) ? undefined : parsed
}

const safeParseNumber = (value: string | string[] | undefined): number | undefined => {
  if (typeof value !== 'string') return undefined
  const parsed = parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
}

const safeParseDate = (value: string | string[] | undefined): Date | undefined => {
  const num = safeParseNumber(value)
  return num === undefined ? undefined : new Date(num)
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end(`Method ${req.method} Not Allowed`)
  }

  // Access cookies from req.cookies
  const tbEndpoint = req.cookies['tb_endpoint'] || VERCEL_EDGE_PING_URL

  // Access query parameters from req.query
  const params = req.query
  const search: ParsedSearchParams = {}

  // Manual Parsing using req.query
  const levelsParam = params.levels
  if (typeof levelsParam === 'string') {
    search.level = levelsParam.split(',').filter((l): l is Level => LEVELS.includes(l as Level))
  }

  const methodsParam = params.methods
  if (typeof methodsParam === 'string') {
    search.method = methodsParam
      .split(',')
      .filter((m): m is Method => METHODS.includes(m as Method))
  }

  const regionsParam = params.regions
  if (typeof regionsParam === 'string') {
    search.region = regionsParam
      .split(',')
      .filter((r): r is Region => VERCEL_EDGE_REGIONS.includes(r as Region))
  }

  const statusStart = safeParseInt(params.statusStart)
  const statusEnd = safeParseInt(params.statusEnd)
  if (statusStart !== undefined && statusEnd !== undefined) search.status = [statusStart, statusEnd]

  const latencyStart = safeParseInt(params.latencyStart)
  const latencyEnd = safeParseInt(params.latencyEnd)
  if (latencyStart !== undefined && latencyEnd !== undefined)
    search.latency = [latencyStart, latencyEnd]

  const timestampStart = safeParseDate(params.timestampStart)
  const timestampEnd = safeParseDate(params.timestampEnd)
  if (timestampStart && timestampEnd) search.timestamp = [timestampStart, timestampEnd]

  const urlParam = params.url
  if (typeof urlParam === 'string') search.url = urlParam

  const sortParam = params.sort
  if (typeof sortParam === 'string') {
    const [id, descStr] = sortParam.split('.')
    if (id) {
      search.sort = { id, desc: descStr === 'desc' }
    }
  }

  const cursorParam = params.cursor
  if (cursorParam) search.cursor = safeParseDate(cursorParam)

  const directionParam = params.direction
  if (
    typeof directionParam === 'string' &&
    (directionParam === 'prev' || directionParam === 'next')
  )
    search.direction = directionParam

  const uuidParam = params.uuid
  if (typeof uuidParam === 'string') search.uuid = uuidParam

  // Construct baseParams for downstream API calls
  const baseParams = new URLSearchParams()
  if (search.level?.length) baseParams.set('levels', search.level.join(','))
  if (search.method?.length) baseParams.set('methods', search.method.join(','))
  if (search.region?.length) baseParams.set('regions', search.region.join(','))
  if (search.url) baseParams.set('url', search.url)
  if (search.status) {
    baseParams.set('statusesStart', search.status[0].toString())
    baseParams.set('statusesEnd', search.status[1].toString())
  }
  if (search.latency) {
    baseParams.set('latencyStart', search.latency[0].toString())
    baseParams.set('latencyEnd', search.latency[1].toString())
  }
  if (search.timestamp) {
    baseParams.set('timestampStart', search.timestamp[0].getTime().toString())
    baseParams.set('timestampEnd', search.timestamp[1].getTime().toString())
  }

  const searchParams = new URLSearchParams(baseParams)
  const facetsParams = new URLSearchParams(baseParams)
  const statsParams = new URLSearchParams(baseParams)

  searchParams.set('pageSize', PAGE_SIZE.toString())

  if (
    search.cursor &&
    search.timestamp?.[1] &&
    search.cursor.getTime() <= search.timestamp[1].getTime()
  ) {
    searchParams.set('timestampEnd', search.cursor.getTime().toString())
  } else if (search.cursor && !search.timestamp) {
    searchParams.set('timestampEnd', search.cursor.getTime().toString())
  }

  if (search.timestamp) {
    statsParams.set('interval', evaluateInterval(search.timestamp)?.toString() ?? '1440')
    statsParams.set('timestampStart', search.timestamp[0].getTime().toString())
    statsParams.set('timestampEnd', search.timestamp[1].getTime().toString())
  } else {
    statsParams.set('timestampStart', subDays(new Date(), 30).getTime().toString())
    statsParams.set('timestampEnd', new Date().getTime().toString())
    statsParams.set('interval', '1440')
  }

  try {
    const [dataRes, chartRes, facetsRes] = await Promise.all([
      fetch(`${tbEndpoint}/api/get?${searchParams.toString()}`),
      fetch(`${tbEndpoint}/api/stats?${statsParams.toString()}`),
      fetch(`${tbEndpoint}/api/facets?${facetsParams.toString()}`),
    ])

    if (!dataRes.ok || !chartRes.ok || !facetsRes.ok) {
      console.error('Tinybird API error:', {
        /* ... details ... */
      })
      // ... error body logging ...
      throw new Error('Failed to fetch data from Tinybird API')
    }

    const dataResult = (await dataRes.json()) as {
      data: ColumnType[]
      rows_before_limit_at_least: number
    }
    const chartResult = (await chartRes.json()) as { data: BaseChartSchema[] }
    const facetsResult = (await facetsRes.json()) as { data: _TemporalFacetsType[] }

    const data = dataResult.data
    const filterRowCount = dataResult.rows_before_limit_at_least
    const chartData = chartResult.data
    const _facets = facetsResult.data

    const facets = transformFacets(_facets)
    const lastItem = data[data.length - 1]
    // Safely access timestamp and convert
    const lastTimestampNum = lastItem?.timestamp
      ? safeParseNumber(lastItem.timestamp.toString())
      : undefined
    const isLastPage = !lastTimestampNum || filterRowCount < PAGE_SIZE
    // Use timestamp number for cursor consistency
    const nextCursorValue = isLastPage ? null : lastTimestampNum ? lastTimestampNum - 1 : null

    const responsePayload = {
      data,
      prevCursor: null,
      nextCursor: nextCursorValue,
      meta: {
        chartData,
        facets,
        totalRowCount: facets['level']?.total ?? 0,
        filterRowCount,
      },
    } satisfies InfiniteQueryResponse<ColumnType[]>

    // Use SuperJSON.stringify and res.send
    const serializedPayload = SuperJSON.stringify(responsePayload)
    res.setHeader('Content-Type', 'application/json')
    res.status(200).send(serializedPayload)
  } catch (error) {
    console.error('Error fetching or processing data table light API:', error)
    // Use SuperJSON.stringify and res.send for error response too
    const errorPayload = {
      data: [],
      prevCursor: null,
      nextCursor: null,
      meta: { chartData: [], facets: {}, totalRowCount: 0, filterRowCount: 0 },
    } satisfies InfiniteQueryResponse<ColumnType[]>
    const serializedError = SuperJSON.stringify(errorPayload)
    res.setHeader('Content-Type', 'application/json')
    res.status(500).send(serializedError)
  }
}

/** ---------- UTILS ---------- */

function transformFacets(facets: _TemporalFacetsType[]): Record<string, FacetMetadataSchema> {
  return facets.reduce(
    (acc, curr) => {
      let facet = acc[curr.facet]
      if (!facet) {
        facet = { rows: [], total: 0 }
        // Initialize min/max for latency/status if it's the first time
        if (curr.facet === 'latency' || curr.facet === 'status') {
          facet.min = Infinity
          facet.max = -Infinity
        }
        acc[curr.facet] = facet
      }

      const numericValue = parseInt(curr.value, 10)
      const count = curr.count

      if (curr.facet === 'status') {
        facet.rows.push({ value: numericValue, total: count })
        facet.rows.sort((a, b) => (a.value as number) - (b.value as number))
        facet.min = Math.min(facet.min ?? Infinity, numericValue)
        facet.max = Math.max(facet.max ?? -Infinity, numericValue)
      } else if (curr.facet === 'latency') {
        facet.rows.push({ value: numericValue, total: count })
        facet.min = Math.min(facet.min ?? Infinity, numericValue)
        facet.max = Math.max(facet.max ?? -Infinity, numericValue)
      } else {
        facet.rows.push({ value: curr.value, total: count })
      }
      facet.total += count
      return acc
    },
    {} as Record<string, FacetMetadataSchema>
  )
}

function evaluateInterval(dates: [Date, Date] | null): number | null {
  if (!dates) return null

  const timeDiffInMinutes = Math.abs(differenceInMinutes(dates[0], dates[1]))

  if (timeDiffInMinutes <= 60 * 2) return 5
  if (timeDiffInMinutes <= 60 * 12) return 30
  if (timeDiffInMinutes <= 60 * 24 * 2) return 60
  if (timeDiffInMinutes <= 60 * 24 * 7) return 240
  return 1440
}
