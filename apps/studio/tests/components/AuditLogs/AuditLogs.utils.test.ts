import dayjs from 'dayjs'
import type { FilterGroup } from 'ui-patterns/FilterBar'
import { describe, expect, test } from 'vitest'

import { filterByFilterGroup } from '@/components/interfaces/AuditLogs/AuditLogs.utils'
import {
  TIMESTAMP_MICROS_PER_MS,
  type AuditLog,
} from '@/data/organizations/organization-audit-logs-query'

// Timestamps are in microseconds (e.g. 1777471903844000 = April 2026)
const TS_A = 1777471903844000
const TS_B = 1777471903845000
const TS_C = 1777471903846000

function makeLog(overrides: Partial<AuditLog> = {}): AuditLog {
  return {
    timestamp: TS_A,
    request_id: 'req-1',
    action: { name: 'test', method: 'GET', route: '/api/test', status: 200 },
    actor: { token_type: 'bearer' },
    ...overrides,
  }
}

const logA = makeLog({ timestamp: TS_A, request_id: 'req-a', project_ref: 'proj-1' })
const logB = makeLog({
  timestamp: TS_B,
  request_id: 'req-b',
  project_ref: 'proj-2',
  actor: { token_type: 'bearer', user_id: 'user-1' },
})
const logC = makeLog({
  timestamp: TS_C,
  request_id: 'req-c',
  actor: { token_type: 'bearer', user_id: 'user-2' },
})

describe('timestamp conversion (microseconds → milliseconds)', () => {
  test('dividing by 1000 produces a valid date', () => {
    expect(dayjs(TS_A / TIMESTAMP_MICROS_PER_MS).isValid()).toBe(true)
  })

  test('produces the correct year', () => {
    expect(dayjs(TS_A / TIMESTAMP_MICROS_PER_MS).year()).toBe(2026)
  })

  test('dayjs.unix on a microsecond value produces an invalid date', () => {
    // Guard: confirms the bug we fixed — dayjs.unix() treats the value as seconds,
    // overflowing JS Date's max and producing "Invalid Date"
    expect(dayjs.unix(TS_A).isValid()).toBe(false)
  })
})

describe('filterByFilterGroup', () => {
  const project = (value: string) => ({
    propertyName: 'project',
    operator: '=',
    value,
  })
  const user = (value: string) => ({
    propertyName: 'user',
    operator: '=',
    value,
  })
  const date = {
    propertyName: 'date',
    operator: '=',
    value: '2026-04-29T00:00:00.000Z – 2026-04-30T00:00:00.000Z',
  }
  const logs = [logA, logB, logC]
  const requestIds = (group: FilterGroup) =>
    filterByFilterGroup(logs, group).map((l) => l.request_id)

  test('returns all logs when there are no conditions', () => {
    expect(requestIds({ logicalOperator: 'AND', conditions: [] })).toEqual([
      'req-a',
      'req-b',
      'req-c',
    ])
  })

  test('OR matches logs from any of the projects', () => {
    expect(
      requestIds({ logicalOperator: 'OR', conditions: [project('proj-1'), project('proj-2')] })
    ).toEqual(['req-a', 'req-b'])
  })

  test('AND of two different projects matches nothing', () => {
    expect(
      requestIds({ logicalOperator: 'AND', conditions: [project('proj-1'), project('proj-2')] })
    ).toEqual([])
  })

  test('evaluates nested groups: date AND (project A OR project B)', () => {
    expect(
      requestIds({
        logicalOperator: 'AND',
        conditions: [
          date,
          { logicalOperator: 'OR', conditions: [project('proj-1'), project('proj-2')] },
        ],
      })
    ).toEqual(['req-a', 'req-b'])
  })

  test('ignores the date condition since the API already applies it', () => {
    expect(requestIds({ logicalOperator: 'AND', conditions: [date] })).toEqual([
      'req-a',
      'req-b',
      'req-c',
    ])
    expect(requestIds({ logicalOperator: 'OR', conditions: [date, project('proj-1')] })).toEqual([
      'req-a',
    ])
  })

  test('ignores chips that have no value yet', () => {
    expect(requestIds({ logicalOperator: 'AND', conditions: [project('')] })).toEqual([
      'req-a',
      'req-b',
      'req-c',
    ])
    expect(
      requestIds({ logicalOperator: 'OR', conditions: [project(''), project('proj-1')] })
    ).toEqual(['req-a'])
  })

  test('ignores an empty nested group', () => {
    expect(
      requestIds({
        logicalOperator: 'AND',
        conditions: [project('proj-1'), { logicalOperator: 'OR', conditions: [] }],
      })
    ).toEqual(['req-a'])
  })

  test('excludes logs without a project_ref when a project is selected', () => {
    expect(requestIds({ logicalOperator: 'OR', conditions: [project('proj-1')] })).not.toContain(
      'req-c'
    )
  })

  test('OR matches logs from any of the users', () => {
    expect(
      requestIds({ logicalOperator: 'OR', conditions: [user('user-1'), user('user-2')] })
    ).toEqual(['req-b', 'req-c'])
  })

  test('excludes logs without a matching actor when a user is selected', () => {
    expect(requestIds({ logicalOperator: 'AND', conditions: [user('user-unknown')] })).toEqual([])
  })

  test('combines user and project: user AND project', () => {
    expect(
      requestIds({ logicalOperator: 'AND', conditions: [user('user-1'), project('proj-2')] })
    ).toEqual(['req-b'])
    expect(
      requestIds({ logicalOperator: 'AND', conditions: [user('user-2'), project('proj-2')] })
    ).toEqual([])
  })
})
