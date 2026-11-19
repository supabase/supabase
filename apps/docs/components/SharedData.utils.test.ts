import { describe, expect, it } from 'vitest'

import { getLogFieldReference } from './SharedData.utils'

describe('getLogFieldReference', () => {
  it('distinguishes ClickHouse columns from both prefixed and unprefixed attributes', () => {
    const source = {
      name: 'API Gateway',
      reference: 'edge_logs',
      fields: [
        { path: 'id', type: 'string' },
        { path: 'identifier', type: 'string' },
        { path: 'metadata.response.status_code', type: 'number' },
      ],
    }
    const [result] = getLogFieldReference([source])
    expect(result.reference).toBe('edge_logs')
    expect(result.fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: 'id', queryField: 'id', queryType: 'String' }),
        expect.objectContaining({ path: 'identifier', queryField: "log_attributes['identifier']" }),
        expect.objectContaining({
          path: 'metadata.response.status_code',
          type: 'number',
          queryField: "log_attributes['response.status_code']",
          queryType: 'String',
        }),
        expect.objectContaining({
          path: 'timestamp',
          queryField: 'timestamp',
          queryType: 'DateTime64',
        }),
        expect.objectContaining({ path: 'source', queryField: 'source' }),
      ])
    )
    expect(result.fields.filter((field) => field.path === 'id')).toHaveLength(1)
    expect(source.fields).toHaveLength(3)
  })
})
