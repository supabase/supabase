import { describe, expect, it } from 'vitest'

import { sandboxNameFor } from './sandbox-name'

describe('sandboxNameFor', () => {
  it('is deterministic and safe to expose as a Vercel resource name', () => {
    expect(sandboxNameFor({ projectRef: 'project-a', chatId: 'chat-a' })).toBe(
      sandboxNameFor({ projectRef: 'project-a', chatId: 'chat-a' })
    )
    expect(sandboxNameFor({ projectRef: 'project-a', chatId: 'chat-a' })).toMatch(
      /^studio-[a-f0-9]{32}$/
    )
  })

  it('does not collide across projects or chats', () => {
    const names = new Set([
      sandboxNameFor({ projectRef: 'project-a', chatId: 'chat-a' }),
      sandboxNameFor({ projectRef: 'project-a', chatId: 'chat-b' }),
      sandboxNameFor({ projectRef: 'project-b', chatId: 'chat-a' }),
    ])

    expect(names).toHaveLength(3)
  })
})
