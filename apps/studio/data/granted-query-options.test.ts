import { describe, expect, expectTypeOf, test } from 'vitest'

import { grantedQueryOptions } from './granted-query-options'

const queryKey = ['things'] as const
const queryFn = async () => ({ count: 1 })

describe('grantedQueryOptions', () => {
  test('without a queryFn, enabled is false even if the caller asks for true', () => {
    expect(grantedQueryOptions({ queryKey, queryFn: undefined }, { enabled: true }).enabled).toBe(
      false
    )
    expect(
      grantedQueryOptions({ queryKey, queryFn: undefined }, { enabled: () => true }).enabled
    ).toBe(false)
    expect(grantedQueryOptions({ queryKey, queryFn: undefined }).enabled).toBe(false)
  })

  test('without a queryFn, queryFn stays undefined rather than skipToken', () => {
    expect(grantedQueryOptions({ queryKey, queryFn: undefined }).queryFn).toBeUndefined()
  })

  test("with a queryFn, the caller's enabled passes through", () => {
    expect(grantedQueryOptions({ queryKey, queryFn }).enabled).toBe(true)
    expect(grantedQueryOptions({ queryKey, queryFn }, { enabled: false }).enabled).toBe(false)
    const enabled = () => false
    expect(grantedQueryOptions({ queryKey, queryFn }, { enabled }).enabled).toBe(enabled)
  })

  test('passes other caller options through', () => {
    const result = grantedQueryOptions(
      { queryKey, queryFn },
      { staleTime: 5, refetchOnMount: 'always' }
    )
    expect(result.staleTime).toBe(5)
    expect(result.refetchOnMount).toBe('always')
  })

  test('the factory queryKey and queryFn win over caller values', () => {
    const result = grantedQueryOptions(
      { queryKey, queryFn },
      {
        // @ts-expect-error queryKey and queryFn are owned by the factory
        queryKey: ['other'],
        queryFn: async () => ({ count: 2 }),
      }
    )
    expect(result.queryKey).toBe(queryKey)
    expect(result.queryFn).toBe(queryFn)
  })

  test('select infers TData', () => {
    const result = grantedQueryOptions<{ count: number }, Error, string>(
      { queryKey, queryFn },
      {
        select: (data) => {
          expectTypeOf(data).toEqualTypeOf<{ count: number }>()
          return String(data.count)
        },
      }
    )
    expect(result.select).toBeTypeOf('function')
    expectTypeOf(result.select).not.toBeAny()
  })

  test('carries the brand the type-aware lint rule looks for', () => {
    // fga/no-spread-granted-query-options detects this exact property name (scripts/eslint-rules/fga.cjs).
    const result = grantedQueryOptions({ queryKey, queryFn })
    expectTypeOf(result).toHaveProperty('__grantedQueryOptions')
  })
})
