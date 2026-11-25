import dayjs, { type Dayjs } from 'dayjs'

const WAREHOUSE_METRICS_MAX_RANGE_DAYS = 30

/** Keeps every series under ~720 points so a batch with many labeled series stays under the API's response cap. */
export const getWarehouseMetricsInterval = (
  startIso: string,
  endIso: string
): '1m' | '5m' | '30m' | '1h' => {
  const hours = dayjs(endIso).diff(dayjs(startIso), 'hour', true)
  if (hours <= 3) return '1m'
  if (hours <= 24) return '5m'
  if (hours <= 24 * 5) return '30m'
  return '1h'
}

export type WarehouseMetricsRange =
  | {
      status: 'ok'
      startDate: string
      endDate: string
      interval: ReturnType<typeof getWarehouseMetricsInterval>
      isClamped: boolean
    }
  | { status: 'out_of_range' }

export const resolveWarehouseMetricsRange = ({
  start,
  end,
  now = dayjs(),
}: {
  start: string
  end: string
  now?: Dayjs
}): WarehouseMetricsRange => {
  const latest = now.startOf('minute')
  // Counted in hours, not calendar days, so a DST change doesn't shift the bound
  // A few minutes of slack so the oldest bound doesn't fall out of range while the page is open
  const earliest = latest.subtract(WAREHOUSE_METRICS_MAX_RANGE_DAYS * 24, 'hour').add(5, 'minute')

  const isStartTooEarly = dayjs(start).isBefore(earliest)
  const isEndInFuture = dayjs(end).isAfter(now)

  const startDate = (isStartTooEarly ? earliest : dayjs(start)).toISOString()
  const endDate = (isEndInFuture ? latest : dayjs(end)).toISOString()

  if (!dayjs(endDate).isAfter(dayjs(startDate))) return { status: 'out_of_range' }

  return {
    status: 'ok',
    startDate,
    endDate,
    interval: getWarehouseMetricsInterval(startDate, endDate),
    isClamped: isStartTooEarly || isEndInFuture,
  }
}
