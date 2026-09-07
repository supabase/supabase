import { aiPrompts } from './ai-prompts.data'
import {
  monitoringAgents,
  type MonitoringAgent,
  type MonitoringAgentId,
} from './monitoring-agents.data'

export type ScheduleMark = {
  key: string
  label?: string
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DAY_LABELS = ['12am', '6am', '12pm', '6pm'] as const

export function getMonitoringAgent(id: string): MonitoringAgent {
  const agent = monitoringAgents[id as MonitoringAgentId]
  if (!agent) {
    throw new Error(`Unknown monitoring agent id: ${id}`)
  }
  return agent
}

export function getMonitoringAgentPrompt(agent: MonitoringAgent): string {
  const prompt = aiPrompts[agent.promptId]
  if (!prompt) {
    throw new Error(`Unknown AiPrompt id: ${agent.promptId}`)
  }
  return prompt
}

export function getScheduleMarks(intervalMinutes: number): {
  window: 'day' | 'week'
  marks: ScheduleMark[]
} {
  if (intervalMinutes >= 24 * 60) {
    return {
      window: 'week',
      marks: WEEKDAY_LABELS.map((label) => ({ key: label, label })),
    }
  }

  const marksPerDay = (24 * 60) / intervalMinutes
  if (!Number.isInteger(marksPerDay)) {
    throw new Error(`intervalMinutes must divide 1440 evenly. Received: ${intervalMinutes}`)
  }

  const labelEvery = marksPerDay / 4
  const marks = Array.from({ length: marksPerDay }, (_, index) => ({
    key: String(index),
    label: index % labelEvery === 0 ? DAY_LABELS[index / labelEvery] : undefined,
  }))

  return { window: 'day', marks }
}

export function getScheduleLabel(agent: MonitoringAgent): string {
  const cadence = agent.schedule.cadence
  return cadence.charAt(0).toUpperCase() + cadence.slice(1)
}
