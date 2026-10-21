import { MAX_LOG_RETENTION_DAYS } from '@/lib/constants/logs'

export const parseUnifiedLogsDuration = (value: string) => {
  const seconds = Number(value)
  const isValid =
    Number.isFinite(seconds) && seconds >= 0.001 && seconds <= MAX_LOG_RETENTION_DAYS * 86400
  return isValid ? seconds : null
}

export const getUnifiedLogsDurationMs = (seconds?: number | null) =>
  (parseUnifiedLogsDuration(String(seconds ?? 3600)) ?? 3600) * 1000

export const filterUnifiedLogsWindow = <T extends { date: Date }>(
  rows: T[],
  durationSeconds: number | null | undefined,
  anchor?: number
) => {
  if (durationSeconds == null || anchor === undefined) return rows
  const start = anchor - getUnifiedLogsDurationMs(durationSeconds)
  return rows.filter((row) => row.date.getTime() >= start && row.date.getTime() <= anchor)
}
