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

  it.each([
    ['monitoring-agent-health', 'Doctor'],
    ['monitoring-agent-security', 'Security Officer'],
    ['monitoring-agent-performance', 'Personal Trainer'],
    ['monitoring-agent-usage', 'Accountant'],
  ])('serializes the %s agent prompt', (id, persona) => {
    const markdown = AiPrompt({ props: { id, includeInMarkdown: true } })

    expect(markdown).toContain('**AI Prompt**')
    expect(markdown).toContain(persona)
    expect(markdown).toContain('read-only')
    expect(markdown).toContain('```text')
  })

  it('fails clearly for an unknown opted-in prompt', () => {
    expect(() => AiPrompt({ props: { id: 'missing-prompt', includeInMarkdown: true } })).toThrow(
      'Unknown AiPrompt id: missing-prompt'
    )
  })
})
