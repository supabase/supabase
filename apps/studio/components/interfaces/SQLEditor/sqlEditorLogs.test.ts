import { describe, expect, it } from 'vitest'

import {
  getDefaultLogsTimeRange,
  isLogsSource,
  LOGS_SQL_AI_CONTEXT,
  SQL_EDITOR_LOGS_SOURCE_ID,
} from './sqlEditorLogs'

describe('isLogsSource', () => {
  it('matches the logs sentinel id', () => {
    expect(isLogsSource(SQL_EDITOR_LOGS_SOURCE_ID)).toBe(true)
  })

  it('does not match a database identifier or undefined', () => {
    expect(isLogsSource('some-project-ref')).toBe(false)
    expect(isLogsSource(undefined)).toBe(false)
  })
})

describe('getDefaultLogsTimeRange', () => {
  it('returns a 24 hour window ending at the given time', () => {
    const now = new Date('2026-06-22T12:00:00.000Z')
    const { iso_timestamp_start, iso_timestamp_end } = getDefaultLogsTimeRange(now)
    expect(iso_timestamp_end).toBe('2026-06-22T12:00:00.000Z')
    expect(iso_timestamp_start).toBe('2026-06-21T12:00:00.000Z')
  })
})

describe('LOGS_SQL_AI_CONTEXT', () => {
  it('describes the logs table, sources, and casting so the assistant writes ClickHouse SQL', () => {
    expect(LOGS_SQL_AI_CONTEXT).toContain('ClickHouse')
    expect(LOGS_SQL_AI_CONTEXT).toContain('log_attributes')
    expect(LOGS_SQL_AI_CONTEXT).toContain("source = 'edge_logs'")
    expect(LOGS_SQL_AI_CONTEXT).toContain('toInt32OrZero')
    expect(LOGS_SQL_AI_CONTEXT).toContain('Do not write Postgres SQL')
  })
})
