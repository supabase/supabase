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
    ['monitoring-agent-health', 'Health monitor'],
    ['monitoring-agent-security', 'Security monitor'],
    ['monitoring-agent-performance', 'Performance monitor'],
    ['monitoring-agent-usage', 'Capacity monitor'],
  ])('serializes the %s agent prompt', (id, persona) => {
    const markdown = AiPrompt({ props: { id, includeInMarkdown: true } })

    expect(markdown).toContain('**AI Prompt**')
    expect(markdown).toContain(persona)
    expect(markdown).toContain('read-only')
    expect(markdown).toContain('```text')
  })

  it('serializes the monitoring overview prompt', () => {
    const markdown = AiPrompt({
      props: { id: 'monitoring-and-debugging', includeInMarkdown: true },
    })

    expect(markdown).toContain('Help me monitor and debug my Supabase project.')
    expect(markdown).toContain('npm install -g supabase')
    expect(markdown).toContain('npx plugins add supabase-community/supabase-plugin')
    expect(markdown).toContain('read-only')
    expect(markdown).toContain('https://supabase.com/docs/guides/monitoring-and-debugging.md')
    expect(markdown).toContain('```text')
  })

  it('fails clearly for an unknown opted-in prompt', () => {
    expect(() => AiPrompt({ props: { id: 'missing-prompt', includeInMarkdown: true } })).toThrow(
      'Unknown AiPrompt id: missing-prompt'
    )
  })
})
