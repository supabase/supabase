import { describe, expect, it } from 'vitest'

import { sanitizeArrayOfObjects } from './sanitize'

describe('sanitizeArrayOfObjects', () => {
  it('redacts sensitive keys case-insensitively', () => {
    const input = [{ Password: 'hunter2', username: 'alice' }]

    const result = sanitizeArrayOfObjects(input) as Array<Record<string, unknown>>

    expect(result).toEqual([{ Password: '[REDACTED]', username: 'alice' }])
  })

  it('honors custom redaction and extra sensitive keys', () => {
    const input = [
      {
        customSensitive: 'value',
        token: 'should hide',
        nested: { customSensitive: 'also hide' },
      },
    ]

    const result = sanitizeArrayOfObjects(input, {
      redaction: '<removed>',
      sensitiveKeys: ['customSensitive'],
    }) as Array<any>

    expect(result[0].customSensitive).toBe('<removed>')
    expect(result[0].token).toBe('<removed>')
    expect(result[0].nested).toEqual({ customSensitive: '<removed>' })
    expect(input[0].nested.customSensitive).toBe('also hide')
  })

  it('redacts known secret patterns in strings', () => {
    const samples = [
      { value: '192.168.0.1' },
      { value: '2001:0db8:85a3:0000:0000:8a2e:0370:7334' },
      { value: 'AKIAIOSFODNN7EXAMPLE' },
      { value: 'wJalrXUtnFEMI/K7MDENG+bPxRfiCYEXAMPLEKEY' },
      { value: 'Bearer abcdEFGHijklMNOPqrstUVWXyz0123456789' },
      {
        value:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
      },
      { value: 'A'.repeat(32) },
    ]

    const result = sanitizeArrayOfObjects(samples) as Array<{ value: string }>

    for (const item of result) {
      expect(item.value).toBe('[REDACTED]')
    }
  })

  it('limits recursion depth and uses truncation notice', () => {
    const input = [
      {
        level1: {
          level2: {
            level3: {
              password: 'secret',
            },
          },
        },
      },
    ]

    const [result] = sanitizeArrayOfObjects(input, {
      maxDepth: 2,
      truncationNotice: '<truncated>',
    }) as Array<any>

    expect(result.level1.level2).toBe('<truncated>')
    expect(result.level1).not.toBe(input[0].level1)
    expect(input[0].level1.level2.level3.password).toBe('secret')
  })

  it('handles circular references without crashing', () => {
    const obj: any = { name: 'loop' }
    obj.self = obj

    const [result] = sanitizeArrayOfObjects([obj]) as Array<any>

    expect(result.self).toBe('[Circular]')
    expect(result.name).toBe('loop')
  })

  it('sanitizes complex types consistently', () => {
    const date = new Date('2024-01-01T00:00:00.000Z')
    const regex = /abc/gi
    const fn = () => {}
    const arrayBuffer = new ArrayBuffer(8)
    const typedArray = new Uint8Array([1, 2, 3])
    const map = new Map<any, any>()
    map.set('password', 'hunter2')
    map.set('public', date)
    const set = new Set<any>([1, date])
    const url = new URL('https://example.com/path')
    const error = new Error('Token is Bearer abcdEFGHijklMNOPqrstUVWXyz0123456789')
    const custom = new (class Custom {
      toString() {
        return 'custom-instance'
      }
    })()

    const [result] = sanitizeArrayOfObjects([
      {
        date,
        regex,
        fn,
        arrayBuffer,
        typedArray,
        map,
        set,
        url,
        error,
        custom,
      },
    ]) as Array<any>

    expect(result.date).toBe('2024-01-01T00:00:00.000Z')
    expect(result.regex).toBe('/abc/gi')
    expect(result.fn).toBe('[Function]')
    expect(result.arrayBuffer).toBe('[ArrayBuffer byteLength=8]')
    expect(result.typedArray).toBe('[TypedArray byteLength=3]')
    expect(result.map).toEqual([
      ['[REDACTED]', '[REDACTED]'],
      ['public', '2024-01-01T00:00:00.000Z'],
    ])
    expect(result.set).toEqual([1, '2024-01-01T00:00:00.000Z'])
    expect(result.url).toBe('https://example.com/path')
    expect(result.error).toEqual({
      name: 'Error',
      message: 'Token is [REDACTED]',
      stack: '[REDACTED: max depth reached]',
    })
    expect(result.custom).toBe('custom-instance')
  })

  it('sanitizes primitive array entries', () => {
    const [redacted, number] = sanitizeArrayOfObjects([
      'Bearer abcdEFGHijklMNOPqrstUVWXyz0123456789',
      42,
    ]) as Array<any>

    expect(redacted).toBe('[REDACTED]')
    expect(number).toBe(42)
  })

  it('applies maxDepth=0 to top-level entries', () => {
    const result = sanitizeArrayOfObjects(
      [{ password: 'secret', nested: { value: 'test' } }, 'visible'],
      {
        maxDepth: 0,
        truncationNotice: '<blocked>',
      }
    ) as Array<any>

    expect(result[0]).toBe('<blocked>')
    expect(result[1]).toBe('visible')
  })
})
