import {
  getMonitoringAgent,
  getMonitoringAgentHarnesses,
  getMonitoringAgentPrompt,
} from '~/data/monitoring-agents.utils'
import { toMarkdown } from 'mdast-util-to-markdown'

type HandlerContext = {
  props: Record<string, unknown>
}

const IN_PAGE_LINK = /\[([^\]]+)\]\(#[^)]+\)/g

function renderMarkdownSteps(steps: string[]): string {
  return steps.map((step, index) => `${index + 1}. ${step.replace(IN_PAGE_LINK, '$1')}`).join('\n')
}

export function AgentSetup({ props }: HandlerContext): string {
  const agent = getMonitoringAgent(String(props.id ?? ''))
  const prompt = getMonitoringAgentPrompt(agent)
  const harnesses = getMonitoringAgentHarnesses(agent)

  const sections = [
    `**Step 1: Copy the prompt**\n\n${toMarkdown({ type: 'code', lang: 'text', value: prompt }).trimEnd()}`,
    '**Step 2: Schedule it in your agent**',
    ...harnesses.map((harness) => {
      const parts = [`**${harness.label}**`, harness.intro, renderMarkdownSteps(harness.steps)]
      if (harness.note) parts.push(harness.note)
      parts.push(`[${harness.label} docs](${harness.docsUrl})`)
      return parts.join('\n\n')
    }),
  ]

  return sections.join('\n\n')
}
