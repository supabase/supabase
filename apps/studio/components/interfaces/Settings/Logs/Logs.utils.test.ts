import { describe, expect, test } from 'vitest'

import type { LogData } from './Logs.types'
import { buildLogsPrompt, formatLogsAsJson, formatLogsAsMarkdown } from './Logs.utils'

const createLog = (overrides: Partial<LogData> = {}): LogData => ({
  id: 'test-id',
  timestamp: 1621323232312,
  event_message: 'test message',
  ...overrides,
})

describe('Logs.utils', () => {
  describe('formatLogsAsJson', () => {
    test('formats single log as JSON', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'test message' })]
      const result = formatLogsAsJson(rows)
      expect(result).toContain('"id": "1"')
      expect(result).toContain('"event_message": "test message"')
    })

    test('formats multiple logs as JSON array', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'first' }),
        createLog({ id: '2', event_message: 'second' }),
      ]
      const result = formatLogsAsJson(rows)
      expect(result).toContain('"id": "1"')
      expect(result).toContain('"id": "2"')
    })
  })

  describe('formatLogsAsMarkdown', () => {
    test('formats single log with timestamp', () => {
      const rows: LogData[] = [
        createLog({
          id: '123',
          timestamp: 1621323232312,
          event_message: 'Test error',
          status: '500',
        }),
      ]
      const result = formatLogsAsMarkdown(rows)
      expect(result).toContain('## Log 1')
      expect(result).toContain('**Timestamp:**')
      expect(result).toContain('**Message:** Test error')
      expect(result).toContain('**Details:**')
    })

    test('formats multiple logs with separators', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'first error' }),
        createLog({ id: '2', event_message: 'second error' }),
      ]
      const result = formatLogsAsMarkdown(rows)
      expect(result).toContain('## Log 1')
      expect(result).toContain('## Log 2')
      expect(result).toContain('---')
    })
  })

  describe('buildLogsPrompt', () => {
    test('builds prompt with single log', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'error occurred' })]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('1 Supabase log entry')
      expect(result).toContain('error occurred')
      expect(result).toContain('What do these logs indicate')
    })

    test('builds prompt with multiple logs', () => {
      const rows: LogData[] = [
        createLog({ id: '1', event_message: 'error 1' }),
        createLog({ id: '2', event_message: 'error 2' }),
      ]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('2 Supabase log entries')
    })

    test('handles singular correctly', () => {
      const rows: LogData[] = [createLog({ id: '1', event_message: 'single error' })]
      const result = buildLogsPrompt(rows)
      expect(result).toContain('1 Supabase log entry')
    })
  })
})
