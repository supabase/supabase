import { describe, expect, it } from 'vitest'

import { getSqlEditorLogsUrl } from './sqlEditorLogsLink.utils'

const EXECUTED_AT = new Date('2026-09-16T12:30:00.000Z').valueOf()

describe('getSqlEditorLogsUrl', () => {
  it('points at the project Postgres logs', () => {
    const url = getSqlEditorLogsUrl({ projectRef: 'abc', executedAt: EXECUTED_AT })
    expect(url.startsWith('/project/abc/logs/postgres-logs?')).toBe(true)
  })

  it('windows the range around the run', () => {
    const url = getSqlEditorLogsUrl({ projectRef: 'abc', executedAt: EXECUTED_AT })
    const params = new URLSearchParams(url.split('?')[1])

    expect(params.get('its')).toBe('2026-09-16T12:28:00.000Z')
    expect(params.get('ite')).toBe('2026-09-16T12:32:00.000Z')
  })

  it('encodes the timestamps so the previewer receives them intact', () => {
    const url = getSqlEditorLogsUrl({ projectRef: 'abc', executedAt: EXECUTED_AT })
    expect(url).not.toMatch(/\s/)
    expect(url).not.toContain(':00.000Z&')
  })
})
