import { describe, expect, it } from 'vitest'

import {
  getSinceLastDeployInvocationPhrase,
  getSinceLastDeployLogRange,
  toAlertError,
  toIsoTimestamp,
} from './EdgeFunctionRecentErrors.utils'

describe('EdgeFunctionRecentErrors.utils', () => {
  it('preserves readable error messages for the function error alert', () => {
    expect(toAlertError('boom')).toEqual({ message: 'boom' })
    expect(toAlertError({ message: 'broken' })).toEqual({ message: 'broken' })
    expect(toAlertError({ message: 123 })).toBeUndefined()
    expect(toAlertError(null)).toBeUndefined()
  })

  it('accepts deploy timestamps from API dates, milliseconds, and microseconds', () => {
    const deployedAt = '2026-03-20T10:15:00.000Z'
    const deployedAtMilliseconds = Date.parse(deployedAt)

    expect(toIsoTimestamp(deployedAt)).toBe(deployedAt)
    expect(toIsoTimestamp(String(deployedAtMilliseconds))).toBe(deployedAt)
    expect(toIsoTimestamp(String(deployedAtMilliseconds * 1000))).toBe(deployedAt)
    expect(toIsoTimestamp('')).toBeUndefined()
    expect(toIsoTimestamp('not-a-date')).toBeUndefined()
  })

  it.each([
    {
      behavior: 'shows errors since a recent deploy',
      deployedAt: '2026-03-20T10:15:00.000Z',
      start: '2026-03-20T10:15:00.000Z',
      end: '2026-03-20T12:00:00.000Z',
    },
    {
      behavior: 'never queries more than the last 24 hours after an older deploy',
      deployedAt: '2026-03-18T00:00:00.000Z',
      start: '2026-03-19T12:00:00.000Z',
      end: '2026-03-20T12:00:00.000Z',
    },
    {
      behavior: 'avoids a reversed range when the deploy timestamp is ahead of the clock',
      deployedAt: '2026-03-20T13:00:00.000Z',
      start: '2026-03-20T13:00:00.000Z',
      end: '2026-03-20T13:00:00.000Z',
    },
  ])('$behavior', ({ deployedAt, start, end }) => {
    expect(getSinceLastDeployLogRange(deployedAt, new Date('2026-03-20T12:00:00.000Z'))).toEqual({
      isoTimestampStart: start,
      isoTimestampEnd: end,
    })
  })

  it('leaves the preview without a deploy range when the deploy timestamp is absent', () => {
    expect(getSinceLastDeployLogRange()).toEqual({})
  })

  it('uses singular and plural invocation counts in the deploy summary', () => {
    expect(getSinceLastDeployInvocationPhrase(1)).toBe('1 invocation')
    expect(getSinceLastDeployInvocationPhrase(1200)).toBe('1,200 invocations')
  })
})
