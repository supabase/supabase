import { describe, expect, test } from 'vitest'

import { INTEGRATIONS } from './Integrations.constants'

describe('INTEGRATIONS.navigate', () => {
  test.each([
    { id: 'queues', pageId: 'overview' },
    { id: 'graphiql', pageId: 'graphiql' },
  ])(
    'returns a stable component reference across repeated calls for $id/$pageId',
    ({ id, pageId }) => {
      const integration = INTEGRATIONS.find((item) => item.id === id)
      expect(integration).toBeDefined()

      const first = integration?.navigate({ id, pageId, childId: undefined })
      const second = integration?.navigate({ id, pageId, childId: undefined })

      expect(first).toBeTruthy()
      expect(first).toBe(second)
    }
  )
})
