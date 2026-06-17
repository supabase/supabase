import { describe, expect, it, vi } from 'vitest'

import { updateDocsFeedbackComment } from './Feedback.utils'

describe('updateDocsFeedbackComment', () => {
  it('updates the feedback row by id with the comment', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    const update = vi.fn(() => ({ eq }))
    const from = vi.fn(() => ({ update }))
    const supabase = { from } as any

    await updateDocsFeedbackComment(supabase, {
      id: 42,
      title: 'Great explanation',
      comment: 'This page was really helpful.',
    })

    expect(from).toHaveBeenCalledWith('feedback')
    expect(update).toHaveBeenCalledWith({
      title: 'Great explanation',
      comment: 'This page was really helpful.',
    })
    expect(eq).toHaveBeenCalledWith('id', 42)
  })
})
