import { describe, expect, it } from 'vitest'

import { AiPrompt } from './AiPrompt'

describe('AiPrompt markdown schema', () => {
  it('exports the title and body from a prompt prop expression', () => {
    expect(
      AiPrompt({
        props: { prompt: JSON.stringify('Help me add Supabase to my Next.js project.') },
        children: '',
      })
    ).toBe(
      `**AI Prompt**

Help me add Supabase to my Next.js project.`
    )
  })

  it('parses escaped newlines in the prompt expression', () => {
    expect(
      AiPrompt({
        props: { prompt: JSON.stringify('Line one.\nLine two.') },
        children: '',
      })
    ).toBe(
      `**AI Prompt**

Line one.
Line two.`
    )
  })

  it('keeps the title when the prompt is empty', () => {
    expect(AiPrompt({ props: { prompt: '""' }, children: '' })).toBe('**AI Prompt**')
  })
})
