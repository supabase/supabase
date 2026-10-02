import { describe, expect, it } from 'vitest'

import { isValidGraphQLEnumValueName, sanitizeIntrospectionResponse } from './GraphiQLTab.utils'

describe('isValidGraphQLEnumValueName', () => {
  it('matches GraphQL enum value naming rules', () => {
    expect(isValidGraphQLEnumValueName('a')).toBe(true)
    expect(isValidGraphQLEnumValueName('_private')).toBe(true)
    expect(isValidGraphQLEnumValueName('VALUE_1')).toBe(true)
    expect(isValidGraphQLEnumValueName('c and d')).toBe(false)
    expect(isValidGraphQLEnumValueName('1_value')).toBe(false)
    expect(isValidGraphQLEnumValueName('true')).toBe(false)
    expect(isValidGraphQLEnumValueName(null)).toBe(false)
  })
})

describe('sanitizeIntrospectionResponse', () => {
  it('removes enum values that cannot be represented in a GraphQL schema', () => {
    const response = {
      data: {
        __schema: {
          types: [
            {
              kind: 'ENUM',
              name: 'Status',
              enumValues: [
                { name: 'a' },
                { name: 'b' },
                { name: 'c and d' },
                { name: '1_value' },
                { name: 'null' },
              ],
            },
            {
              kind: 'OBJECT',
              name: 'Query',
              fields: [],
            },
          ],
        },
      },
    }

    const sanitized = sanitizeIntrospectionResponse(response)
    const sanitizedStatusType = sanitized.data.__schema.types[0] as {
      enumValues: Array<{ name: string }>
    }
    const originalStatusType = response.data.__schema.types[0] as {
      enumValues: Array<{ name: string }>
    }

    expect(sanitizedStatusType.enumValues.map(({ name }) => name)).toEqual(['a', 'b'])
    expect(originalStatusType.enumValues.map(({ name }) => name)).toEqual([
      'a',
      'b',
      'c and d',
      '1_value',
      'null',
    ])
  })

  it('returns the original response when no enum values are removed', () => {
    const response = {
      data: {
        __schema: {
          types: [
            {
              kind: 'ENUM',
              name: 'Status',
              enumValues: [{ name: 'a' }, { name: 'VALUE_1' }],
            },
          ],
        },
      },
    }

    expect(sanitizeIntrospectionResponse(response)).toBe(response)
  })

  it('leaves non-introspection responses unchanged', () => {
    const response = { data: { project: { ref: 'default' } } }

    expect(sanitizeIntrospectionResponse(response)).toBe(response)
  })
})
