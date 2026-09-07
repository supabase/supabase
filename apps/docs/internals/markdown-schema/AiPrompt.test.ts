import { aiPrompts } from '~/data/ai-prompts.data'
import { describe, expect, it } from 'vitest'

import { AiPrompt } from './AiPrompt'

describe('AiPrompt markdown schema', () => {
  it('omits prompts by default', () => {
    expect(AiPrompt({ props: { id: 'nextjs' } })).toBe('')
  })

  it('serializes an opted-in prompt from the shared registry', () => {
    const markdown = AiPrompt({
      props: { id: 'nextjs', includeInMarkdown: true },
    })

    expect(markdown).toContain('**AI Prompt**')
    expect(markdown).toContain('Help me add Supabase to my Next.js project.')
    expect(markdown).toContain('```text')
  })

  it.each(Object.keys(aiPrompts).filter((id) => id.startsWith('monitoring-')))(
    'exports the complete shared %s prompt when opted in',
    (id) => {
      const markdown = AiPrompt({ props: { id, includeInMarkdown: true } })
      expect(markdown.match(/```text\n([\s\S]*?)\n```/)?.[1]).toBe(
        aiPrompts[id as keyof typeof aiPrompts]
      )
    }
  )

  it('fails clearly for an unknown opted-in prompt', () => {
    expect(() => AiPrompt({ props: { id: 'missing-prompt', includeInMarkdown: true } })).toThrow(
      'Unknown AiPrompt id: missing-prompt'
    )
  })
})
