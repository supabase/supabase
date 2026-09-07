import { monitoringAgents } from '~/data/monitoring-agents.data'
import { getMonitoringAgentPrompt } from '~/data/monitoring-agents.utils'
import { describe, expect, it } from 'vitest'

import { AgentSetup } from './AgentSetup'

const agents = Object.values(monitoringAgents)

describe('AgentSetup markdown schema', () => {
  it.each(agents)('exports the same complete prompt as the UI for $id', (agent) => {
    const markdown = AgentSetup({ props: { id: agent.id } })
    const prompt = markdown.match(/```text\n([\s\S]*?)\n```/)?.[1]

    expect(prompt).toBe(getMonitoringAgentPrompt(agent))
    expect(markdown).toContain('/docs/guides/observability/automate-with-agents#run-the-routine')
  })

  it('fails clearly for an unknown agent', () => {
    expect(() => AgentSetup({ props: { id: 'missing' } })).toThrow(
      'Unknown monitoring agent id: missing'
    )
  })
})
