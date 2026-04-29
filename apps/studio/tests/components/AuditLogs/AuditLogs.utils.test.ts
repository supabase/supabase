import { describe, expect, test } from 'vitest'

import {
  filterByProjects,
  filterByUsers,
  sortAuditLogs,
} from '@/components/interfaces/Organization/AuditLogs/AuditLogs.utils'
import type { V2AuditLog } from '@/data/profile/profile-audit-logs-query'

function makeLog(overrides: Partial<V2AuditLog> = {}): V2AuditLog {
  return {
    timestamp: 1000,
    request_id: 'req-1',
    action: { name: 'test', method: 'GET', route: '/api/test', status: 200 },
    actor: { token_type: 'bearer' },
    ...overrides,
  }
}

const logA = makeLog({ timestamp: 1000, request_id: 'req-a', project_ref: 'proj-1' })
const logB = makeLog({
  timestamp: 2000,
  request_id: 'req-b',
  project_ref: 'proj-2',
  actor: { token_type: 'bearer', user_id: 'user-1' },
})
const logC = makeLog({
  timestamp: 3000,
  request_id: 'req-c',
  actor: { token_type: 'bearer', user_id: 'user-2' },
})

describe('sortAuditLogs', () => {
  test('sorts descending (newest first)', () => {
    const result = sortAuditLogs([logA, logC, logB], true)
    expect(result.map((l) => l.request_id)).toEqual(['req-c', 'req-b', 'req-a'])
  })

  test('sorts ascending (oldest first)', () => {
    const result = sortAuditLogs([logC, logA, logB], false)
    expect(result.map((l) => l.request_id)).toEqual(['req-a', 'req-b', 'req-c'])
  })

  test('does not mutate the input array', () => {
    const input = [logC, logA]
    sortAuditLogs(input, true)
    expect(input[0].request_id).toBe('req-c')
  })

  test('returns empty array unchanged', () => {
    expect(sortAuditLogs([], true)).toEqual([])
  })

  test('handles a single log', () => {
    expect(sortAuditLogs([logA], true)).toEqual([logA])
  })
})

describe('filterByUsers', () => {
  test('returns all logs when filter list is empty', () => {
    expect(filterByUsers([logA, logB, logC], [])).toEqual([logA, logB, logC])
  })

  test('filters to matching user_id', () => {
    const result = filterByUsers([logA, logB, logC], ['user-1'])
    expect(result.map((l) => l.request_id)).toEqual(['req-b'])
  })

  test('filters to multiple user_ids', () => {
    const result = filterByUsers([logA, logB, logC], ['user-1', 'user-2'])
    expect(result.map((l) => l.request_id)).toEqual(['req-b', 'req-c'])
  })

  test('excludes logs with no user_id when filtering', () => {
    const result = filterByUsers([logA, logB], ['user-1'])
    expect(result.map((l) => l.request_id)).toEqual(['req-b'])
  })

  test('returns empty array when no logs match', () => {
    expect(filterByUsers([logA, logB, logC], ['user-unknown'])).toEqual([])
  })
})

describe('filterByProjects', () => {
  test('returns all logs when filter list is empty', () => {
    expect(filterByProjects([logA, logB, logC], [])).toEqual([logA, logB, logC])
  })

  test('filters to matching project_ref', () => {
    const result = filterByProjects([logA, logB, logC], ['proj-1'])
    expect(result.map((l) => l.request_id)).toEqual(['req-a'])
  })

  test('filters to multiple project_refs', () => {
    const result = filterByProjects([logA, logB, logC], ['proj-1', 'proj-2'])
    expect(result.map((l) => l.request_id)).toEqual(['req-a', 'req-b'])
  })

  test('excludes logs with no project_ref when filtering', () => {
    const result = filterByProjects([logA, logC], ['proj-1'])
    expect(result.map((l) => l.request_id)).toEqual(['req-a'])
  })

  test('returns empty array when no logs match', () => {
    expect(filterByProjects([logA, logB, logC], ['proj-unknown'])).toEqual([])
  })
})
