import { describe, expect, it } from 'vitest'

import {
  buildGroupAssistantPrompt,
  formatLogTimestamp,
  formatSingleLineMessage,
  getFunctionRuntimeLogsSql,
  getRecentErrorGroups,
  getRecentErrorGroupsBase,
  getRelatedExecutionIds,
  getStatusBadgeVariant,
  toAlertError,
} from './EdgeFunctionRecentErrors.utils'

describe('EdgeFunctionRecentErrors.utils', () => {
  it('normalizes alert errors and single-line messages', () => {
    expect(toAlertError('boom')).toEqual({ message: 'boom' })
    expect(toAlertError({ message: 'broken' })).toEqual({ message: 'broken' })
    expect(toAlertError({ message: 123 })).toBeUndefined()
    expect(toAlertError(null)).toBeUndefined()

    expect(formatSingleLineMessage('  first line\n second\t\tline  ')).toBe(
      'first line second line'
    )
  })

  it('builds runtime log SQL and escapes interpolated values', () => {
    expect(getFunctionRuntimeLogsSql({ functionId: undefined, executionIds: ['abc'] })).toBe('')
    expect(getFunctionRuntimeLogsSql({ functionId: 'fn_123', executionIds: [] })).toBe('')

    expect(
      getFunctionRuntimeLogsSql({
        functionId: "fn_'123",
        executionIds: ['exec_1', "exec_'2"],
        limit: 25,
      })
    )
      .toBe(`select id, function_logs.timestamp, event_message, metadata.event_type, metadata.function_id, metadata.execution_id, metadata.level from function_logs
cross join unnest(metadata) as metadata
where metadata.function_id = 'fn_''123' and metadata.execution_id in ('exec_1', 'exec_''2')
order by timestamp desc
limit 25`)
  })

  it('groups recent failed invocations by parsed error message', () => {
    const groups = getRecentErrorGroupsBase([
      {
        id: 'invocation-1',
        event_message: 'POST | 500 | database exploded',
        method: 'POST',
        status_code: 500,
        execution_id: 'exec-1',
        execution_time_ms: 123.7,
        timestamp: 100,
      },
      {
        id: 'invocation-2',
        event_message: 'POST | 500 | database exploded',
        method: 'POST',
        status_code: 500,
        execution_id: 'exec-2',
        execution_time_ms: 85.1,
        timestamp: 120,
      },
      {
        id: 'invocation-3',
        event_message: '',
        method: 'GET',
        status_code: 503,
        execution_id: '',
        timestamp: 110,
      },
    ])

    expect(groups).toEqual([
      {
        message: 'database exploded',
        count: 2,
        lastSeen: 120,
        lastExecutionId: 'exec-2',
        lastStatusCode: '500',
        lastMethod: 'POST',
        executionTime: '85ms',
        executionIds: ['exec-1', 'exec-2'],
      },
      {
        message: 'Unknown error',
        count: 1,
        lastSeen: 110,
        lastExecutionId: undefined,
        lastStatusCode: '503',
        lastMethod: 'GET',
        executionTime: undefined,
        executionIds: [],
      },
    ])
  })

  it('deduplicates execution ids and attaches grouped runtime logs', () => {
    const recentErrorGroupsBase = [
      {
        message: 'database exploded',
        count: 2,
        lastSeen: 120,
        lastExecutionId: 'exec-2',
        lastStatusCode: '500',
        lastMethod: 'POST',
        executionTime: '85ms',
        executionIds: ['exec-1', 'exec-2', 'exec-1'],
      },
    ]

    expect(getRelatedExecutionIds(recentErrorGroupsBase)).toEqual(['exec-1', 'exec-2'])

    expect(
      getRecentErrorGroups({
        recentErrorGroupsBase,
        functionRuntimeLogs: [
          {
            id: 'runtime-log-1',
            execution_id: 'exec-1',
            level: 'error',
            event_message: 'stack trace',
            timestamp: 101,
          },
          {
            id: 'runtime-log-2',
            execution_id: 'exec-2',
            level: 'error',
            event_message: 'stack trace',
            timestamp: 121,
          },
          {
            id: 'runtime-log-3',
            execution_id: 'exec-2',
            event_type: 'warn',
            event_message: 'retrying upstream',
            timestamp: 119,
          },
          {
            id: 'runtime-log-4',
            execution_id: '',
            level: 'info',
            event_message: 'ignored',
            timestamp: 999,
          },
        ],
      })
    ).toEqual([
      {
        ...recentErrorGroupsBase[0],
        logs: [
          {
            key: 'error:stack trace',
            message: 'stack trace',
            level: 'error',
            count: 2,
            lastSeen: 121,
          },
          {
            key: 'warn:retrying upstream',
            message: 'retrying upstream',
            level: 'warn',
            count: 1,
            lastSeen: 119,
          },
        ],
      },
    ])
  })

  it('formats timestamps, prompts, and status variants', () => {
    expect(formatLogTimestamp(undefined, 'time')).toBe('-')
    expect(formatLogTimestamp('2026-03-20T10:15:00.000Z', 'time')).toBe('10:15:00')

    expect(
      buildGroupAssistantPrompt(
        {
          message: 'database exploded',
          count: 2,
          lastSeen: 1742465700000000,
          lastExecutionId: 'exec-2',
          lastStatusCode: '500',
          lastMethod: 'POST',
          executionTime: '85ms',
          executionIds: ['exec-1', 'exec-2'],
          logs: [
            {
              key: 'error:stack trace',
              message: 'stack trace',
              level: 'error',
              count: 2,
              lastSeen: 1742465700000000,
            },
          ],
        },
        'my-function'
      )
    ).toContain('Analyze this recurring edge function error for `my-function`.')

    expect(getStatusBadgeVariant()).toBe('destructive')
    expect(getStatusBadgeVariant('500')).toBe('destructive')
    expect(getStatusBadgeVariant('404')).toBe('default')
  })
})
