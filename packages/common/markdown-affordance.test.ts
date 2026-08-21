import { describe, expect, it } from 'vitest'

import { askAiPrompt, askAiUrls } from './markdown-affordance'

describe('askAiUrls', () => {
  it('embeds the encoded prompt for both agents', () => {
    const { chatgpt, claude } = askAiUrls('https://supabase.com/blog/some-post')
    const prompt = encodeURIComponent(
      'Read from https://supabase.com/blog/some-post so I can ask questions about its contents'
    )
    expect(chatgpt).toBe(`https://chatgpt.com/?hint=search&q=${prompt}`)
    expect(claude).toBe(`https://claude.ai/new?q=${prompt}`)
  })

  it('encodes spaces and slashes so the prompt survives as a single query param', () => {
    const { chatgpt } = askAiUrls('https://supabase.com/changelog')
    expect(chatgpt).not.toContain(' ')
    expect(chatgpt.split('q=')[1]).not.toContain('/')
  })
})

describe('askAiPrompt', () => {
  it('references the page URL verbatim', () => {
    expect(askAiPrompt('https://supabase.com/pricing')).toBe(
      'Read from https://supabase.com/pricing so I can ask questions about its contents'
    )
  })
})
