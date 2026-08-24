import type { AiPromptId } from './ai-prompts.data'

export const monitoringAgents = {
  health: {
    id: 'health',
    name: 'Doctor',
    promptId: 'monitoring-agent-health' as AiPromptId,
    schedule: {
      cadence: 'every 15 minutes',
      intervalMinutes: 15,
      scheduled: 'Run it every 15 minutes on a schedule.',
      onDemand:
        'Run it on demand after a deployment, or whenever you need a health check outside that interval.',
    },
  },
  security: {
    id: 'security',
    name: 'Security officer',
    promptId: 'monitoring-agent-security' as AiPromptId,
    schedule: {
      cadence: 'once per day',
      intervalMinutes: 1440,
      scheduled: 'Run it once per day on a schedule.',
      onDemand: 'Run it on demand after you change Auth, RLS, or other access controls.',
    },
  },
  performance: {
    id: 'performance',
    name: 'Personal trainer',
    promptId: 'monitoring-agent-performance' as AiPromptId,
    schedule: {
      cadence: 'once per hour',
      intervalMinutes: 60,
      scheduled: 'Run it once per hour on a schedule.',
      onDemand: 'Run it on demand after a latency regression or a schema change.',
    },
  },
  usage: {
    id: 'usage',
    name: 'Accountant',
    promptId: 'monitoring-agent-usage' as AiPromptId,
    schedule: {
      cadence: 'once each morning',
      intervalMinutes: 1440,
      scheduled: 'Run it once per day on a schedule.',
      onDemand: 'Run it on demand after an unexpected traffic change.',
    },
  },
} as const

export type MonitoringAgentId = keyof typeof monitoringAgents
export type MonitoringAgent = (typeof monitoringAgents)[MonitoringAgentId]
