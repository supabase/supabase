import dayjs from 'dayjs'
import { describe, expect, it } from 'vitest'

import { getNextRun } from './CronJobTableCell.utils'

const asIso = (timestamp: number | undefined) =>
  timestamp === undefined ? undefined : dayjs.utc(timestamp).toISOString()

describe('getNextRun', () => {
  describe('cron expressions', () => {
    it('parses an expression that uses wildcards', () => {
      const nextRun = getNextRun('*/5 * * * *')

      expect(nextRun).toBeTypeOf('number')
      expect(nextRun).toBeGreaterThan(Date.now() - 60_000)
    })

    // pg_cron and the Studio schedule validator both accept expressions with every field
    // restricted. They used to be handed to the "n seconds" branch and reported as
    // unparseable, which surfaced as "Unable to parse next run for job" in the table.
    it.each([
      ['0 3 1 1 1', '01-01T03:00:00'],
      ['30 8 15 6 2', '06-15T08:30:00'],
      ['0 0 1 1 0', '01-01T00:00:00'],
    ])('parses %s, which contains no wildcard', (schedule) => {
      expect(getNextRun(schedule)).toBeTypeOf('number')
    })

    it('parses a list of values with no wildcard', () => {
      expect(getNextRun('0,30 1 1 1 1')).toBeTypeOf('number')
    })

    it('translates the pg_cron $ (last day of month) into cron-parser L', () => {
      const nextRun = getNextRun('0 0 $ * *')

      expect(nextRun).toBeTypeOf('number')
      // The last day of a month is always the 28th or later
      expect(dayjs.utc(nextRun).date()).toBeGreaterThanOrEqual(28)
    })

    it('resolves the schedule in UTC', () => {
      const nextRun = getNextRun('0 0 * * *')

      expect(dayjs.utc(nextRun).hour()).toBe(0)
      expect(dayjs.utc(nextRun).minute()).toBe(0)
    })

    it('returns undefined for an unparseable schedule', () => {
      expect(getNextRun('not a cron expression')).toBeUndefined()
      expect(getNextRun('99 99 99 99 99')).toBeUndefined()
      expect(getNextRun('')).toBeUndefined()
    })
  })

  describe('"n seconds" intervals', () => {
    const lastRun = '2026-08-11T10:00:00.000Z'

    it('adds the interval to the last run', () => {
      expect(asIso(getNextRun('30 seconds', lastRun))).toBe('2026-08-11T10:00:30.000Z')
    })

    it('accepts the singular form', () => {
      expect(asIso(getNextRun('1 second', lastRun))).toBe('2026-08-11T10:00:01.000Z')
    })

    it('is case and whitespace insensitive', () => {
      expect(asIso(getNextRun('  30 SECONDS  ', lastRun))).toBe('2026-08-11T10:00:30.000Z')
    })

    it('returns undefined when the job has never run', () => {
      expect(getNextRun('30 seconds')).toBeUndefined()
    })

    it('returns undefined when the last run is not a valid date', () => {
      expect(getNextRun('30 seconds', 'whenever')).toBeUndefined()
    })
  })
})
