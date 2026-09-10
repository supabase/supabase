import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'

dayjs.extend(utc)

export type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
  warning_count: number
}

export type ChartIntervalKey = '1hr' | '1day' | '7day'

export const sumTotal = (data: LogsBarChartDatum[]): number =>
  data.reduce((acc, r) => acc + r.ok_count + r.warning_count + r.error_count, 0)

export const sumWarnings = (data: LogsBarChartDatum[]): number =>
  data.reduce((acc, r) => acc + r.warning_count, 0)

export const sumErrors = (data: LogsBarChartDatum[]): number =>
  data.reduce((acc, r) => acc + r.error_count, 0)

export const computeSuccessAndNonSuccessRates = (
  totalRequests: number,
  totalWarnings: number,
  totalErrors: number
): { successRate: number; nonSuccessRate: number } => {
  if (totalRequests <= 0) return { successRate: 0, nonSuccessRate: 0 }
  const nonSuccessRate = ((totalWarnings + totalErrors) / totalRequests) * 100
  const successRate = 100 - nonSuccessRate
  return { successRate, nonSuccessRate }
}

export const sortServicesByTraffic = <T extends { total: number }>(services: T[]): T[] =>
  [...services].sort((a, b) => b.total - a.total)

export const isServiceDisabled = (total: number, isLoading: boolean): boolean =>
  !isLoading && total <= 0

export type ServiceCardStats = {
  eventChartData: LogsBarChartDatum[]
  total: number
  warningCount: number
  errorCount: number
}

export type ServiceCard<Entry> = Entry & {
  data: LogsBarChartDatum[]
  total: number
  warn: number
  err: number
}

/** Maps enabled services to card data and orders them by traffic. */
export const buildSortedServiceCards = <
  Key extends string,
  Entry extends { key: Key; enabled: boolean },
>(
  services: Entry[],
  statsByKey: Record<Key, ServiceCardStats>
): ServiceCard<Entry>[] =>
  sortServicesByTraffic(
    services
      .filter((service) => service.enabled)
      .map((service) => {
        const stats = statsByKey[service.key]
        return {
          ...service,
          data: stats.eventChartData,
          total: stats.total,
          warn: stats.warningCount,
          err: stats.errorCount,
        }
      })
  )

/** One-bucket-wide window for a clicked chart bar; the timestamp is the UTC bucket start. */
export const getBucketLogRange = (
  timestamp: string,
  interval: ChartIntervalKey
): { start: string; end: string } => {
  const unit = interval === '1hr' ? 'minute' : interval === '1day' ? 'hour' : 'day'
  return {
    start: timestamp,
    end: dayjs.utc(timestamp).add(1, unit).toISOString(),
  }
}
