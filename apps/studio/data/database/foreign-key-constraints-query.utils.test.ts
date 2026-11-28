import { describe, expect, it } from 'vitest'

import { parsePostgresArrayLiteral } from './foreign-key-constraints-query.utils'

describe('parsePostgresArrayLiteral', () => {
  it('parses a single unquoted element', () => {
    expect(parsePostgresArrayLiteral('{id}')).toEqual(['id'])
  })

  it('parses multiple unquoted elements', () => {
    expect(parsePostgresArrayLiteral('{org_id,user_id}')).toEqual(['org_id', 'user_id'])
  })

  it('removes the quotes Postgres adds around names containing spaces', () => {
    expect(parsePostgresArrayLiteral('{"first name",id}')).toEqual(['first name', 'id'])
  })

  it('does not split on commas inside quoted names', () => {
    expect(parsePostgresArrayLiteral('{"first name","a,b",pid}')).toEqual([
      'first name',
      'a,b',
      'pid',
    ])
  })

  it('unescapes double quotes and backslashes inside quoted names', () => {
    expect(parsePostgresArrayLiteral('{"say \\"hi\\"","back\\\\slash"}')).toEqual([
      'say "hi"',
      'back\\slash',
    ])
  })

  it('keeps braces that are part of a quoted name', () => {
    expect(parsePostgresArrayLiteral('{"{weird}",id}')).toEqual(['{weird}', 'id'])
  })

  it('returns an empty array for an empty array literal', () => {
    expect(parsePostgresArrayLiteral('{}')).toEqual([])
  })

  it('returns an empty array for a value that is not an array literal', () => {
    expect(parsePostgresArrayLiteral('id')).toEqual([])
  })
})
