import { describe, expect, it } from 'vitest'

import { parsePostgresIdentifierArray } from './foreign-key-constraints-query.utils'

describe('parsePostgresIdentifierArray', () => {
  it('parses a single unquoted identifier', () => {
    expect(parsePostgresIdentifierArray('{customer_id}')).toEqual(['customer_id'])
  })

  it('parses multiple unquoted identifiers', () => {
    expect(parsePostgresIdentifierArray('{org_id,bucket_id}')).toEqual(['org_id', 'bucket_id'])
  })

  it('strips quotes from identifiers containing spaces', () => {
    expect(parsePostgresIdentifierArray('{"User ID",id}')).toEqual(['User ID', 'id'])
  })

  it('does not split identifiers containing commas', () => {
    expect(parsePostgresIdentifierArray('{"a,b",c}')).toEqual(['a,b', 'c'])
  })

  it('keeps braces inside quoted identifiers', () => {
    expect(parsePostgresIdentifierArray('{"{weird}"}')).toEqual(['{weird}'])
  })

  it('unescapes quotes and backslashes', () => {
    expect(parsePostgresIdentifierArray('{"say \\"hi\\"","back\\\\slash"}')).toEqual([
      'say "hi"',
      'back\\slash',
    ])
  })

  it('preserves mixed-case identifiers', () => {
    expect(parsePostgresIdentifierArray('{userId,OrgId}')).toEqual(['userId', 'OrgId'])
  })

  it('returns an empty array for an empty array literal', () => {
    expect(parsePostgresIdentifierArray('{}')).toEqual([])
  })
})
