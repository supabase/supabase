import { describe, expect, it } from 'vitest'

import type { EnableCheckState } from './DataApiEnableSwitch.types'
import { enableCheckReducer, getDefaultSchemas } from './DataApiEnableSwitch.utils'

describe('getDefaultSchemas', () => {
  it('returns ["public"] for undefined', () => {
    expect(getDefaultSchemas(undefined)).toEqual(['public'])
  })

  it('returns ["public"] for null', () => {
    expect(getDefaultSchemas(null)).toEqual(['public'])
  })

  it('returns ["public"] for empty string', () => {
    expect(getDefaultSchemas('')).toEqual(['public'])
  })

  it('returns ["public"] for whitespace-only string', () => {
    expect(getDefaultSchemas('  ,  , ')).toEqual(['public'])
  })

  it('parses a single schema', () => {
    expect(getDefaultSchemas('api')).toEqual(['api'])
  })

  it('parses multiple comma-separated schemas', () => {
    expect(getDefaultSchemas('public, storage, graphql_public')).toEqual([
      'public',
      'storage',
      'graphql_public',
    ])
  })

  it('trims whitespace from schemas', () => {
    expect(getDefaultSchemas('  public ,  storage  ')).toEqual(['public', 'storage'])
  })

  it('filters out empty segments', () => {
    expect(getDefaultSchemas('public,,storage,')).toEqual(['public', 'storage'])
  })
})
