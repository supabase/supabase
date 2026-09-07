import { describe, expect, it, vi } from 'vitest'

import { ConversationPersistence } from './conversation-persistence'

describe('provider-owned persistence queue', () => {
  it('serializes mutation revisions before a send', async () => {
    const queue = new ConversationPersistence(vi.fn())
    const order: string[] = []
    void queue.enqueue('chat', async () => {
      await Promise.resolve()
      order.push('create')
    })
    void queue.enqueue('chat', async () => {
      order.push('truncate')
    })
    await queue.ready('chat')
    expect(order).toEqual(['create', 'truncate'])
  })
  it('retains creation/mutation errors and prevents a following send', async () => {
    const onError = vi.fn(),
      send = vi.fn()
    const queue = new ConversationPersistence(onError)
    void queue.enqueue('chat', async () => {
      throw new Error('Save failed')
    })
    await expect(queue.ready('chat').then(send)).rejects.toThrow('Save failed')
    expect(send).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalled()
  })
  it('invalidates old transports and queued work in both backend switch directions', async () => {
    const queue = new ConversationPersistence(vi.fn())
    const work = vi.fn()
    const pending = queue.enqueue('chat', work)
    queue.dispose()
    await expect(pending).rejects.toThrow('context changed')
    await expect(queue.ready('chat')).rejects.toThrow('context changed')
    expect(work).not.toHaveBeenCalled()
  })
})
