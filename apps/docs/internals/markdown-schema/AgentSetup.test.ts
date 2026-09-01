import { describe, expect, it } from 'vitest'

import { AgentSetup } from './AgentSetup'

describe('AgentSetup markdown schema', () => {
  it('serializes the prompt and harness setup for a registered agent', () => {
    const markdown = AgentSetup({ props: { id: 'health' } })

    expect(markdown).toContain('**Prompt**')
    expect(markdown).toContain('You are "Health monitor"')
    expect(markdown).toContain('```text')
    expect(markdown).toContain('**Claude**')
    expect(markdown).toContain('**Codex**')
    expect(markdown).toContain('**Cursor**')
    expect(markdown).toContain('Desktop scheduled task')
    expect(markdown).toContain('`*/15 * * * *`')
    expect(markdown).toContain(
      '[Claude docs](https://code.claude.com/docs/en/desktop-scheduled-tasks)'
    )
    expect(markdown).toContain('[Codex docs](https://developers.openai.com/codex/app/automations)')
    expect(markdown).toContain('[Cursor docs](https://cursor.com/docs/cloud-agent/automations)')
  })

  it('points hourly agents at Claude cloud routines', () => {
    const markdown = AgentSetup({ props: { id: 'performance' } })

    expect(markdown).toContain('claude.ai/code/routines')
    expect(markdown).not.toContain('Desktop scheduled task')
  })

  it('fails clearly for an unknown agent', () => {
    expect(() => AgentSetup({ props: { id: 'missing' } })).toThrow(
      'Unknown monitoring agent id: missing'
    )
  })
})
