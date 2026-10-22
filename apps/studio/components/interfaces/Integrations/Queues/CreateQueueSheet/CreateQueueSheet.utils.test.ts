import { describe, expect, it, vi } from 'vitest'

import { createdQueuePath, navigateToCreatedQueue } from './CreateQueueSheet.utils'

describe('navigateToCreatedQueue', () => {
  it('encodes the queue name in the path', () => {
    expect(createdQueuePath('default', 'orders')).toBe(
      '/project/default/integrations/queues/queues/orders'
    )
    expect(createdQueuePath('default', 'a<b')).toBe(
      '/project/default/integrations/queues/queues/a%3Cb'
    )
  })

  it('navigates only after the panel dismissal resolves', async () => {
    let releaseDismissal: () => void = () => {}
    const dismissal = new Promise<void>((resolve) => {
      releaseDismissal = resolve
    })
    const order: string[] = []
    const navigate = vi.fn(async () => {
      order.push('navigate')
    })

    const pending = navigateToCreatedQueue({
      dismissPanel: async () => {
        order.push('dismiss-start')
        await dismissal
        order.push('dismiss-end')
      },
      navigate,
      projectRef: 'default',
      queueName: 'orders',
    })

    await Promise.resolve()
    expect(navigate).not.toHaveBeenCalled()

    releaseDismissal()
    await pending

    expect(order).toEqual(['dismiss-start', 'dismiss-end', 'navigate'])
    expect(navigate).toHaveBeenCalledWith('/project/default/integrations/queues/queues/orders')
  })
})
