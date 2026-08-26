import { describe, expect, it } from 'vitest'

import { getTypeDisplayFromSchema, type ISchema } from './Reference.api.utils'

describe('getTypeDisplayFromSchema', () => {
  it('resolves a composite given as a single schema object', () => {
    // The shape analytics_v0 and functions_v0 actually ship, e.g.
    // Notification.properties.team_user_ids_for_email
    const schema = { allOf: { type: 'string' }, type: 'array' } as unknown as ISchema

    expect(getTypeDisplayFromSchema(schema)?.displayName).toBe('string')
  })

  it('resolves a composite given as a single element array', () => {
    const schema = { allOf: [{ type: 'string' }] } as unknown as ISchema

    expect(getTypeDisplayFromSchema(schema)?.displayName).toBe('string')
  })

  it('still reports a composite when there is more than one option', () => {
    const schema = { allOf: [{ type: 'string' }, { type: 'integer' }] } as unknown as ISchema

    expect(getTypeDisplayFromSchema(schema)?.displayName).toBe('all of the following options')
  })
})
