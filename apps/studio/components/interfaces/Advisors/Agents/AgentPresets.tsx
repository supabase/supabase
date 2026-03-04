import { useParams } from 'common'
import { useCreateAgentMutation, useCreateAgentTaskMutation } from 'data/advisors/agents-query'
import { Bot, ShieldCheck, Zap, AlertTriangle } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { Badge, Button, Card, CardContent } from 'ui'
import { getTaskPresetsForAgent } from './task-presets'

export interface AgentPreset {
  id: string
  name: string
  summary: string
  icon: typeof Bot
  system_prompt: string
  tools: string[]
}

export const AGENT_PRESETS: AgentPreset[] = [
  {
    id: 'security-advisor',
    name: 'Security Advisor',
    summary: 'Analyzes security issues and recommends fixes for RLS, auth, and access control problems.',
    icon: ShieldCheck,
    system_prompt: `You are a Supabase Security Advisor. Your role is to analyze security-related issues and alerts, explain the risks in clear language, and provide actionable SQL fixes.

When analyzing an issue:
1. Explain what the vulnerability is and why it matters
2. Assess the severity and potential impact
3. Provide a specific SQL fix the user can apply
4. Suggest preventive measures for the future

Always be clear, concise, and provide copy-pasteable SQL when possible.`,
    tools: ['listAlerts', 'getAlert', 'listIssues', 'commentOnAlert'],
  },
  {
    id: 'performance-optimizer',
    name: 'Performance Optimizer',
    summary: 'Identifies query bottlenecks, missing indexes, and provides optimization recommendations.',
    icon: Zap,
    system_prompt: `You are a Supabase Performance Optimizer. Your role is to analyze performance-related issues, identify bottlenecks, and suggest optimizations.

When analyzing an issue:
1. Identify the root cause (missing index, N+1 queries, table bloat, etc.)
2. Explain the performance impact in measurable terms
3. Provide specific SQL to create indexes or optimize queries
4. Estimate the expected improvement

Focus on practical, safe changes. Recommend CONCURRENTLY for index creation when possible.`,
    tools: ['listAlerts', 'getAlert', 'listIssues', 'commentOnAlert', 'listTasks'],
  },
  {
    id: 'incident-responder',
    name: 'Incident Responder',
    summary: 'Triages critical alerts, assesses impact, and coordinates incident response.',
    icon: AlertTriangle,
    system_prompt: `You are a Supabase Incident Responder. Your role is to triage critical issues, assess their impact, and help coordinate a response.

When responding to an incident:
1. Quickly assess severity and blast radius
2. Identify affected users/tables/functions
3. Suggest immediate mitigation steps
4. Provide a root cause analysis
5. Recommend follow-up actions to prevent recurrence

Prioritize speed and clarity. Use bullet points and action items.`,
    tools: ['listAlerts', 'getAlert', 'createAlert', 'listIssues', 'commentOnAlert', 'listAgents', 'listTasks'],
  },
]

export function AgentPresetsCards() {
  const { ref: projectRef } = useParams()
  const createMutation = useCreateAgentMutation(projectRef)
  const createTaskMutation = useCreateAgentTaskMutation(projectRef)

  return (
    <div className="space-y-3">
      <p className="text-sm text-foreground-lighter">
        Get started with a pre-configured agent, or create your own from scratch.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {AGENT_PRESETS.map((preset) => (
          <PresetCard
            key={preset.id}
            preset={preset}
            createMutation={createMutation}
            createTaskMutation={createTaskMutation}
          />
        ))}
      </div>
    </div>
  )
}

function PresetCard({
  preset,
  createMutation,
  createTaskMutation,
}: {
  preset: AgentPreset
  createMutation: ReturnType<typeof useCreateAgentMutation>
  createTaskMutation: ReturnType<typeof useCreateAgentTaskMutation>
}) {
  const [creating, setCreating] = useState(false)
  const Icon = preset.icon

  const handleCreate = async () => {
    setCreating(true)
    try {
      const agent = await createMutation.mutateAsync({
        name: preset.name,
        summary: preset.summary,
        system_prompt: preset.system_prompt,
        tools: preset.tools,
      })

      if (agent?.id) {
        const taskPresets = getTaskPresetsForAgent(preset.id)
        await Promise.all(
          taskPresets.map((tp) =>
            createTaskMutation.mutateAsync({
              agent_id: agent.id,
              name: tp.name,
              description: tp.description,
              schedule: tp.schedule,
              is_unique: tp.is_unique,
              enabled: tp.enabled,
            })
          )
        )
      }

      const taskCount = getTaskPresetsForAgent(preset.id).length
      const taskMsg = taskCount > 0 ? ` with ${taskCount} scheduled task${taskCount !== 1 ? 's' : ''}` : ''
      toast.success(`"${preset.name}" agent created${taskMsg}`)
    } catch {
      toast.error('Failed to create agent')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Card className="flex flex-col">
      <CardContent className="flex flex-col gap-3 p-4 flex-1">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-surface-200 p-2 shrink-0">
            <Icon className="h-4 w-4 text-foreground-lighter" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">{preset.name}</p>
            <p className="text-xs text-foreground-lighter mt-0.5">{preset.summary}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-auto pt-2">
          <Badge variant="default">{preset.tools.length} tools</Badge>
          <Badge variant="outline">
            {getTaskPresetsForAgent(preset.id).length} tasks
          </Badge>
          <Button type="default" size="tiny" loading={creating} onClick={handleCreate}>
            Create agent
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
