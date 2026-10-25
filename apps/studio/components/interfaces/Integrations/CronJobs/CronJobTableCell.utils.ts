import parser from 'cron-parser'
import dayjs from 'dayjs'

import { secondsPattern } from './CronJobs.constants'

/**
 * Works out when a cron job is next due to run.
 *
 * pg_cron accepts two schedule syntaxes: a standard 5-field cron expression, and (since
 * pg_cron 1.5) an interval such as "30 seconds". The interval form is the narrow, fully
 * specified case, so it's detected first and everything else is handed to cron-parser.
 *
 * Sniffing for a "*" to decide instead would skip cron-parser for valid expressions that
 * restrict every field, e.g. "0 3 1 1 1", and report them as unparseable.
 *
 * Returns a millisecond timestamp, or undefined when the next run can't be determined.
 */
export const getNextRun = (schedule: string, lastRun?: string): number | undefined => {
  const normalizedSchedule = schedule.trim().toLocaleLowerCase()

  // cron-parser defaults omitted fields to "*", so it happily parses an empty expression as
  // "every minute". A job with no schedule has no next run.
  if (normalizedSchedule === '') return undefined

  if (secondsPattern.test(normalizedSchedule)) {
    // Best effort only: the interval runs from the last run, so without one there's
    // nothing to count forward from.
    if (lastRun === undefined) return undefined

    const [seconds] = normalizedSchedule.split(/\s+/)
    const nextRun = dayjs(lastRun).add(Number(seconds), 'second')
    return nextRun.isValid() ? nextRun.valueOf() : undefined
  }

  try {
    // pg_cron uses '$' for "last day of month", but cron-parser uses 'L'
    const cronExpression = schedule.trim().replace(/\$/g, 'L')
    return parser.parseExpression(cronExpression, { tz: 'UTC' }).next().getTime()
  } catch (error) {
    return undefined
  }
}
