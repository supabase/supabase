import { getMonitoringAgent, getMonitoringAgentPrompt } from '~/data/monitoring-agents.utils'

import { withDocsBasePath } from '../internal-links'

type HandlerContext = {
  props: Record<string, unknown>
}

export function AgentSetup({ props }: HandlerContext): string {
  const agent = getMonitoringAgent(String(props.id ?? ''))
  const prompt = getMonitoringAgentPrompt(agent)
  const setupUrl = withDocsBasePath('/guides/observability/automate-with-agents#run-the-routine')
  return `**Prompt**\n\n\`\`\`text\n${prompt}\n\`\`\`\n\nFollow [the shared setup steps](${setupUrl}) to configure access, saved state, scheduling, and report routing.`
}
