import { getMonitoringAgent } from '~/data/monitoring-agents.utils'

type HandlerContext = {
  props: Record<string, unknown>
}

export function AgentWatchSchedule({ props }: HandlerContext): string {
  const agent = getMonitoringAgent(String(props.id ?? ''))
  return `${agent.schedule.scheduled}\n\n${agent.schedule.onDemand}`
}
