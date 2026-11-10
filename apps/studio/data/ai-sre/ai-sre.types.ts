export const AI_SRE_ACCESS_LEVELS = ['read_only', 'draft_pr', 'merge_pr'] as const
export type AiSreAccessLevel = (typeof AI_SRE_ACCESS_LEVELS)[number]

export const AI_SRE_FOCUS_AREAS = ['performance', 'security', 'billing'] as const
export type AiSreFocusArea = (typeof AI_SRE_FOCUS_AREAS)[number]

/** Importance weight per focus area, 1 (low) to 5 (critical). 0 means the area is off. */
export type AiSreFocusWeights = Record<AiSreFocusArea, number>

export type AiSreCadence = 'hourly' | 'daily' | 'weekly'

export interface AiSreConfig {
  enabled: boolean
  cadence: AiSreCadence
  focusAreas: AiSreFocusWeights
  githubAccessLevel: AiSreAccessLevel
  systemPrompt: string
  updatedAt: string
}

export const AI_SRE_RUN_STATUSES = ['success', 'partial', 'failed'] as const
export type AiSreRunStatus = (typeof AI_SRE_RUN_STATUSES)[number]

export type AiSreRunTrigger = 'manual' | 'schedule'

export interface AiSreFinding {
  surface: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  symptom: string
  evidence?: string
  recommendation?: string
}

/** One line of a run's live console, persisted so past runs can be reviewed. */
export type AiSreTranscriptEvent =
  | { type: 'text'; text: string }
  | { type: 'reasoning'; text: string }
  | { type: 'tool-call'; toolName: string; input: string }
  | { type: 'tool-result'; toolName: string; output: string }
  | { type: 'tool-error'; toolName: string; error: string }
  | { type: 'error'; message: string }
  | { type: 'finish'; finishReason?: string }

export interface AiSreRun {
  id: string
  startedAt: string
  finishedAt: string | null
  trigger: AiSreRunTrigger
  status: AiSreRunStatus
  summaryMd: string
  findings: AiSreFinding[]
  confidence: number | null
  githubPrUrl: string | null
  transcript: AiSreTranscriptEvent[]
}

export const DEFAULT_AI_SRE_FOCUS_WEIGHTS: AiSreFocusWeights = {
  performance: 3,
  security: 3,
  billing: 3,
}

export const DEFAULT_AI_SRE_SYSTEM_PROMPT =
  'Act as the site reliability engineer for this Supabase project. Prevent problems before users hit them, keep the project stable and secure, and report findings in plain language. Prioritize by severity, attach evidence and a confidence level, and recommend the smallest safe action. Never exceed the autonomy level set for each connected tool.'

export const AI_SRE_CADENCE_OPTIONS: { value: AiSreCadence; label: string }[] = [
  { value: 'hourly', label: 'Every hour' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekly', label: 'Every week' },
]

export const AI_SRE_ACCESS_LEVEL_OPTIONS: {
  value: AiSreAccessLevel
  label: string
  description: string
}[] = [
  { value: 'read_only', label: 'Review only', description: 'Read and explain. Changes nothing.' },
  {
    value: 'draft_pr',
    label: 'Draft pull requests',
    description: 'Describe a pull request with the fix. Does not merge.',
  },
  {
    value: 'merge_pr',
    label: 'Merge pull requests',
    description: 'Describe a pull request and merge it.',
  },
]
