import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  getSinceLastDeployInvocationPhrase,
  getSinceLastDeployLogRange,
  toAlertError,
  toIsoTimestamp,
} from './EdgeFunctionRecentErrors.utils'

describe('EdgeFunctionRecentErrors.utils', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('normalizes alert errors', () => {
    expect(toAlertError('boom')).toEqual({ message: 'boom' })
    expect(toAlertError({ message: 'broken' })).toEqual({ message: 'broken' })
    expect(toAlertError({ message: 123 })).toBeUndefined()
    expect(toAlertError(null)).toBeUndefined()
  })

  it('normalizes deploy timestamps and derives the logs query range', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-03-20T12:00:00.000Z'))

    const deployedAt = '2026-03-20T10:15:00.000Z'
    const deployedAtMilliseconds = Date.parse(deployedAt)

    expect(toIsoTimestamp(deployedAt)).toBe(deployedAt)
    expect(toIsoTimestamp(String(deployedAtMilliseconds))).toBe(deployedAt)
    expect(toIsoTimestamp(String(deployedAtMilliseconds * 1000))).toBe(deployedAt)
    expect(toIsoTimestamp('')).toBeUndefined()
    expect(toIsoTimestamp('not-a-date')).toBeUndefined()

    expect(getSinceLastDeployLogRange(deployedAt)).toEqual({
      isoTimestampStart: deployedAt,
      isoTimestampEnd: '2026-03-20T12:00:00.000Z',
    })

    expect(getSinceLastDeployLogRange('2026-03-20T13:00:00.000Z')).toEqual({
      isoTimestampStart: '2026-03-20T13:00:00.000Z',
      isoTimestampEnd: '2026-03-20T13:00:00.000Z',
    })

    expect(getSinceLastDeployLogRange()).toEqual({})

    expect(getSinceLastDeployLogRange('2026-03-18T00:00:00.000Z')).toEqual({
      isoTimestampStart: '2026-03-19T12:00:00.000Z',
      isoTimestampEnd: '2026-03-20T12:00:00.000Z',
    })

    vi.useRealTimers()
  })

  it('phrases the since-deploy invocation count', () => {
    expect(getSinceLastDeployInvocationPhrase(1)).toBe('1 invocation')
    expect(getSinceLastDeployInvocationPhrase(1200)).toBe('1,200 invocations')
  })
})
