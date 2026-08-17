import {
  getMonitoringAgent,
  getMonitoringAgentHarnesses,
  getMonitoringAgentPrompt,
} from '~/data/monitoring-agents.utils'

type HandlerContext = {
  props: Record<string, unknown>
}

function renderMarkdownSteps(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step}`).join('\n')
}

export function AgentSetup({ props }: HandlerContext): string {
  const agent = getMonitoringAgent(String(props.id ?? ''))
  const prompt = getMonitoringAgentPrompt(agent)
  const harnesses = getMonitoringAgentHarnesses(agent)

  const sections = [
    `**Prompt**\n\n\`\`\`text\n${prompt}\n\`\`\``,
    ...harnesses.map((harness) => {
      const parts = [`**${harness.label}**`, harness.intro, renderMarkdownSteps(harness.steps)]
      if (harness.note) parts.push(harness.note)
      return parts.join('\n\n')
    }),
  ]

  return sections.join('\n\n')
}
