export type AdvisorSeverity = 'critical' | 'warning' | 'info'
export type AdvisorLevel = 'ERROR' | 'WARN' | 'INFO'
export type IssueStatus = 'open' | 'acknowledged' | 'snoozed' | 'resolved' | 'dismissed'

export interface AdvisorRule {
  id: string
  name: string
  title: string
  description: string
  category: string
  source: string
  sql_query: string | null
  edge_function_name: string | null
  api_endpoint: string | null
  severity: AdvisorSeverity
  level: AdvisorLevel
  schedule: string
  cooldown_seconds: number
  is_system: boolean
  is_enabled: boolean
  default_message: string | null
  remediation: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface AdvisorIssue {
  id: string
  title: string
  description: string | null
  severity: AdvisorSeverity
  category: string
  status: IssueStatus
  snoozed_until: string | null
  resolved_at: string | null
  resolved_by: string | null
  dedup_key: string
  alert_count: number
  first_triggered_at: string
  last_triggered_at: string
  suggested_actions: SuggestedAction[]
  actions_taken: ActionTaken[]
  assigned_to: string | null
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

export interface SuggestedAction {
  type: 'link' | 'sql' | 'upgrade' | 'info'
  label: string
  url?: string
  sql?: string
  payload?: Record<string, unknown>
}

export interface ActionTaken {
  type: string
  label: string
  taken_at: string
  taken_by: string
}

export interface AdvisorAlert {
  id: string
  rule_id: string | null
  issue_id: string | null
  severity: AdvisorSeverity
  category: string
  title: string
  description: string | null
  signal_snapshot: Record<string, unknown>
  metadata: Record<string, unknown>
  triggered_at: string
}

export interface AdvisorAgent {
  id: string
  name: string
  summary: string | null
  system_prompt: string | null
  tools: string[]
  created_at: string
  updated_at: string
}

export interface AdvisorAgentTask {
  id: string
  agent_id: string
  name: string
  description: string
  schedule: string
  is_unique: boolean
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdvisorChannel {
  id: string
  type: 'email' | 'slack' | 'webhook' | 'push'
  name: string
  config: Record<string, unknown>
  severity_filter: string[]
  category_filter: string[] | null
  is_enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdvisorConversation {
  id: string
  issue_id: string | null
  task_id: string | null
  title: string | null
  created_at: string
  updated_at: string
  messages?: AdvisorConversationMessage[]
}

export interface AdvisorConversationMessage {
  id: string
  conversation_id: string
  agent_id: string | null
  task_id: string | null
  role: 'user' | 'assistant' | 'system' | 'data' | 'tool'
  parts: unknown[]
  created_at: string
}

export interface AdvisorIssueDetail extends AdvisorIssue {
  alerts: AdvisorAlert[]
  conversations: AdvisorConversation[]
}

export interface AdvisorNotification {
  id: string
  issue_id: string | null
  channel_id: string | null
  channel_type: string
  recipient: string
  payload: Record<string, unknown> | null
  status: 'pending' | 'sent' | 'failed'
  sent_at: string | null
  created_at: string
}
