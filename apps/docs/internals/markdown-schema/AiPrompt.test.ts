import { describe, expect, it } from 'vitest'

import { AiPrompt } from './AiPrompt'

describe('AiPrompt markdown schema', () => {
  it('exports the title and preserved body', () => {
    expect(AiPrompt({ children: 'Help me add Supabase to my Next.js project.' })).toBe(
      `**AI Prompt**

Help me add Supabase to my Next.js project.`
    )
  })

  it('keeps the title when the body is empty', () => {
    expect(AiPrompt({ children: '  ' })).toBe('**AI Prompt**')
  })
})
