export type LogsBarChartDatum = {
  timestamp: string
  error_count: number
  ok_count: number
  warning_count: number
}

export const toLogsBarChartData = (
  rows: Array<Record<string, unknown>> = []
): LogsBarChartDatum[] => {
  return rows.map((r) => ({
    timestamp: r.timestamp?.toString() ?? '',
    ok_count: Number(r.ok_count) || 0,
    warning_count: Number(r.warning_count) || 0,
    error_count: Number(r.error_count) || 0,
  }))
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
