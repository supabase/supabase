export type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
  warning_count: number
}

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

/**
 * Orders services so the busiest (highest total requests) come first. Services
 * with no traffic sink to the end of the list, where the homepage renders them
 * as disabled.
 */
export const sortServicesByTraffic = <T extends { total: number }>(services: T[]): T[] =>
  [...services].sort((a, b) => b.total - a.total)

/**
 * A service card is disabled once loading has settled and the service still has
 * no traffic for the selected period.
 */
export const isServiceDisabled = (total: number, isLoading: boolean): boolean =>
  !isLoading && total <= 0
