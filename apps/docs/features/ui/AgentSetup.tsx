import { getMonitoringAgent } from '~/data/monitoring-agents.utils'
import Link from 'next/link'

import { AiPrompt } from './AiPrompt'

type AgentSetupProps = {
  id: string
}

function AgentSetup({ id }: AgentSetupProps) {
  const agent = getMonitoringAgent(id)
  return (
    <>
      <AiPrompt id={agent.promptId} />
      <p>
        Follow{' '}
        <Link href="/guides/observability/automate-with-agents#run-the-routine">
          the shared setup steps
        </Link>{' '}
        to configure access, saved state, scheduling, and report routing.
      </p>
    </>
  )
}

export { AgentSetup }
export type { AgentSetupProps }
