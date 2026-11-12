import type { ErrorEvent } from '@sentry/nextjs'
import { describe, expect, it } from 'vitest'

import { UserSqlError } from './errors/studio-errors'
import { buildSentryServerOptions } from './sentry-server-options'

const event: ErrorEvent = {
  type: undefined,
  exception: { values: [{ type: 'Error', value: 'boom' }] },
}

describe('buildSentryServerOptions', () => {
  it('drops user SQL errors captured by integrations', () => {
    const err = new UserSqlError({ message: 'syntax error at or near "secret"' })
    const result = buildSentryServerOptions().beforeSend?.(event, { originalException: err })
    expect(result).toBeNull()
  })

  it('passes other errors through', () => {
    const result = buildSentryServerOptions().beforeSend?.(event, {
      originalException: new Error('boom'),
    })
    expect(result).toBe(event)
  })

  it('only sets release when provided', () => {
    expect('release' in buildSentryServerOptions()).toBe(false)
    expect(buildSentryServerOptions({ release: 'abc' }).release).toBe('abc')
  })
})
