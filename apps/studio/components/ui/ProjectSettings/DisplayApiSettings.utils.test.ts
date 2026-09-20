import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import relativeTime from 'dayjs/plugin/relativeTime'
import { describe, expect, it } from 'vitest'

import { getLastUsedAPIKeys } from './DisplayApiSettings.utils'

// getLastUsedAPIKeys humanizes a duration, which needs both plugins.
dayjs.extend(duration)
dayjs.extend(relativeTime)

// JWT-shaped keys: `header.payload.signature`. Matching is done on the signature
// segment ([2]) via startsWith(signature_prefix).
const anonKey = { tags: 'anon', api_key: 'header.payload.anonsignature123' }
const serviceRoleKey = { tags: 'service_role', api_key: 'header.payload.servicesignature456' }

describe('getLastUsedAPIKeys', () => {
  it('returns an empty object when there are no api keys', () => {
    expect(
      getLastUsedAPIKeys([], [{ timestamp: 1, role: 'anon', signature_prefix: 'anon' }])
    ).toEqual({})
  })

  it('returns an empty object when log data is null or empty', () => {
    expect(getLastUsedAPIKeys([anonKey], null)).toEqual({})
    expect(getLastUsedAPIKeys([anonKey], undefined)).toEqual({})
    expect(getLastUsedAPIKeys([anonKey], [])).toEqual({})
  })

  it('maps a matching key to a humanized last-used duration', () => {
    const result = getLastUsedAPIKeys(
      [anonKey],
      [
        {
          timestamp: dayjs().subtract(2, 'hour').valueOf(),
          role: 'anon',
          signature_prefix: 'anonsig',
        },
      ]
    )

    expect(Object.keys(result)).toEqual([anonKey.api_key])
    expect(result[anonKey.api_key]).toContain('hours')
  })

  it('only matches the key whose role and signature prefix line up', () => {
    const result = getLastUsedAPIKeys(
      [anonKey, serviceRoleKey],
      [
        {
          timestamp: dayjs().subtract(1, 'day').valueOf(),
          role: 'service_role',
          signature_prefix: 'servicesig',
        },
      ]
    )

    expect(Object.keys(result)).toEqual([serviceRoleKey.api_key])
    expect(result[anonKey.api_key]).toBeUndefined()
  })

  it('ignores log rows missing a role or signature prefix', () => {
    const result = getLastUsedAPIKeys(
      [anonKey],
      [
        { timestamp: 1, role: 'anon' },
        { timestamp: 2, signature_prefix: 'anonsig' },
      ]
    )

    expect(result).toEqual({})
  })
})
