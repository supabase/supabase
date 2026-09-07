import { aiPrompts } from './ai-prompts.data'
import {
  monitoringAgents,
  type MonitoringAgent,
  type MonitoringAgentId,
} from './monitoring-agents.data'

export type MonitoringAgentHarnessKey = 'claude' | 'codex' | 'cursor'

export type ScheduleMark = {
  key: string
  label?: string
}

export type MonitoringAgentHarnessSetup = {
  key: MonitoringAgentHarnessKey
  label: string
  icon: 'claude' | 'openai' | 'cursor'
  hasDistinctDarkIcon?: boolean
  docsUrl: string
  intro: string
  steps: string[]
  note?: string
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
const DAY_LABELS = ['12am', '6am', '12pm', '6pm'] as const

const MCP_STEP =
  'Connect the [Supabase MCP server](/docs/guides/ai-tools/mcp) with `project_ref` and `read_only=true`.'

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

export function getCronExpression(intervalMinutes: number): string {
  if (intervalMinutes === 15) return '*/15 * * * *'
  if (intervalMinutes === 60) return '0 * * * *'
  if (intervalMinutes === 1440) return '0 9 * * *'
  throw new Error(`Unsupported monitoring agent interval: ${intervalMinutes}`)
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

export function getMonitoringAgentHarnesses(agent: MonitoringAgent): MonitoringAgentHarnessSetup[] {
  const cron = getCronExpression(agent.schedule.intervalMinutes)
  const cadence = agent.schedule.cadence
  const isSubHourly = agent.schedule.intervalMinutes < 60

  return [
    {
      key: 'claude',
      label: 'Claude',
      icon: 'claude',
      docsUrl: isSubHourly
        ? 'https://code.claude.com/docs/en/desktop-scheduled-tasks'
        : 'https://code.claude.com/docs/en/routines',
      intro: isSubHourly
        ? `Create a Claude Desktop scheduled task that runs ${agent.name} ${cadence}.`
        : `Create a Claude routine that runs ${agent.name} ${cadence}.`,
      steps: [
        MCP_STEP,
        isSubHourly
          ? 'In the Claude Code Desktop app, open **Routines**, click **New routine**, and choose **Local**.'
          : 'Open [Claude routines](https://claude.ai/code/routines) or run `/schedule` in Claude Code.',
        `Name it ${agent.name}. Paste the prompt. Set the schedule to ${cadence}.`,
      ],
      note: isSubHourly
        ? 'Cloud routines have a 1-hour minimum. Use a [Desktop scheduled task](https://code.claude.com/docs/en/desktop-scheduled-tasks) for this cadence.'
        : undefined,
    },
    {
      key: 'codex',
      label: 'Codex',
      icon: 'openai',
      hasDistinctDarkIcon: true,
      docsUrl: 'https://developers.openai.com/codex/app/automations',
      intro: `Create a Codex scheduled task that runs ${agent.name} ${cadence}.`,
      steps: [
        MCP_STEP,
        'Open **Scheduled** in the ChatGPT desktop app, or ask Codex to create a standalone scheduled task.',
        `Name it ${agent.name}. Paste the prompt. Set the schedule to ${cadence}. Each run should start a new chat.`,
      ],
    },
    {
      key: 'cursor',
      label: 'Cursor',
      icon: 'cursor',
      hasDistinctDarkIcon: true,
      docsUrl: 'https://cursor.com/docs/cloud-agent/automations',
      intro: `Create a Cursor automation that runs ${agent.name} ${cadence}.`,
      steps: [
        MCP_STEP,
        'Create an automation in the Agents Window, at [cursor.com/automations](https://cursor.com/automations), or with the `/automate` skill.',
        `Name it ${agent.name}. Use a scheduled trigger (${cadence}, cron \`${cron}\`). Paste the prompt. Keep the agent read-only, with no repository.`,
      ],
    },
  ]
}
