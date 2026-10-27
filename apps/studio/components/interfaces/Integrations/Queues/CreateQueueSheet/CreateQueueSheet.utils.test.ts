import { describe, expect, it } from 'vitest'

import { createdQueuePath } from './CreateQueueSheet.utils'

describe('createdQueuePath', () => {
  it('encodes the queue name in the path', () => {
    expect(createdQueuePath('default', 'orders')).toBe(
      '/project/default/integrations/queues/queues/orders'
    )
    expect(createdQueuePath('default', 'a<b')).toBe(
      '/project/default/integrations/queues/queues/a%3Cb'
    )
  })
})
