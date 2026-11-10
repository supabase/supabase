import type { Event } from '@sentry/react'
import { describe, expect, it } from 'vitest'

import { applyStudioErrorPolicy } from './sentry-event-policy'
import { PlatformError, StudioSqlError, UserSqlError } from './studio-errors'

const eventWith = (...values: string[]): Event => ({
  exception: { values: values.map((value) => ({ type: 'Error', value })) },
})

describe('applyStudioErrorPolicy', () => {
  it('drops user SQL errors', () => {
    const err = new UserSqlError({ message: 'syntax error at or near "secret"' })
    expect(applyStudioErrorPolicy(eventWith(err.message), err)).toBeNull()
  })

  it('replaces every exception value of a redacted error and groups by query', () => {
    const err = new StudioSqlError({
      message: 'Failed to run sql query: ERROR:  23505: Key (email)=(a@b.co) already exists',
      sqlState: '23505',
      queryName: 'table-rows',
    })
    const event = applyStudioErrorPolicy(eventWith('Key (email)=(a@b.co) …', 'cause'), err)

    expect(event?.exception?.values?.map((v) => v.value)).toEqual([
      'Postgres error 23505 in query table-rows',
      'Postgres error 23505 in query table-rows',
    ])
    expect(event?.fingerprint).toEqual(['{{ default }}', 'table-rows', '23505'])
  })

  it('leaves other errors alone', () => {
    const err = new PlatformError({ message: 'boom', code: 500 })
    const event = eventWith('boom')
    expect(applyStudioErrorPolicy(event, err)).toEqual(eventWith('boom'))
  })

  it('leaves events without a Studio error alone', () => {
    const event = eventWith('x')
    expect(applyStudioErrorPolicy(event, new Error('x'))).toBe(event)
  })
})
