import { describe, expect, it } from 'vitest'

import { buildEdgeFunctionHeaderAddActions } from './httpHeaderAddActions'

describe('buildEdgeFunctionHeaderAddActions', () => {
  it('includes the apikey header when requested', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'secret-key',
      includeApiKeyHeader: true,
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.createRows()).toEqual([
      { name: 'Authorization', value: 'Bearer secret-key' },
      { name: 'apikey', value: 'secret-key' },
    ])
  })

  it('omits the apikey header when not requested', () => {
    const [authAction] = buildEdgeFunctionHeaderAddActions({
      apiKey: 'service-key',
      includeApiKeyHeader: false,
      createRow: (name, value) => ({ name, value }),
    })

    expect(authAction.createRows()).toEqual([
      { name: 'Authorization', value: 'Bearer service-key' },
    ])
  })
})
