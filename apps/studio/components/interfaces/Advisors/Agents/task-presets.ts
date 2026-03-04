export interface TaskPreset {
  name: string
  description: string
  schedule: string
  is_unique: boolean
  enabled: boolean
}

export interface AgentTaskPresets {
  agentPresetId: string
  tasks: TaskPreset[]
}

export const TASK_PRESETS_BY_AGENT: AgentTaskPresets[] = [
  {
    agentPresetId: 'security-advisor',
    tasks: [
      {
        name: 'Daily Security Review',
        description:
          'Review all open critical security issues and summarize the most urgent ones with recommended fixes.',
        schedule: '0 8 * * *',
        is_unique: false,
        enabled: true,
      },
      {
        name: 'Weekly RLS Audit',
        description:
          'Audit all tables exposed via the API for missing or misconfigured RLS policies.',
        schedule: '0 9 * * 1',
        is_unique: true,
        enabled: true,
      },
    ],
  },
  {
    agentPresetId: 'performance-optimizer',
    tasks: [
      {
        name: 'Daily Performance Check',
        description:
          'Analyze open performance issues, check for new missing indexes and table bloat.',
        schedule: '0 7 * * *',
        is_unique: false,
        enabled: true,
      },
      {
        name: 'Weekly Index Review',
        description: 'Review unused and duplicate indexes and recommend cleanup.',
        schedule: '0 10 * * 1',
        is_unique: true,
        enabled: true,
      },
    ],
  },
  {
    agentPresetId: 'incident-responder',
    tasks: [
      {
        name: 'Hourly Critical Scan',
        description:
          'Check for any new critical issues in the last hour and provide a triage summary.',
        schedule: '0 * * * *',
        is_unique: false,
        enabled: true,
      },
    ],
  },
]

export function getTaskPresetsForAgent(agentPresetId: string): TaskPreset[] {
  return TASK_PRESETS_BY_AGENT.find((p) => p.agentPresetId === agentPresetId)?.tasks ?? []
}
