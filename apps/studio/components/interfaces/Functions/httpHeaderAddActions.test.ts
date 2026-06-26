import { describe, expect, it } from 'vitest'

import { buildEdgeFunctionHeaderAddActions } from './httpHeaderAddActions'

describe('buildEdgeFunctionHeaderAddActions', () => {
  it('includes the apikey header with the provided secret key', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'secret-key',
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.label).toBe('Add apiKey header with secret key')
    expect(authAction.createRows()).toEqual([{ name: 'apikey', value: 'secret-key' }])
  })
})
