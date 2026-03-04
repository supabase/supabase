import { useParams } from 'common'
import { useUpdateIssueMutation } from 'data/advisors/issues-query'
import type { AdvisorIssue, AdvisorRule, SuggestedAction } from 'data/advisors/types'
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Code,
  ExternalLink,
  Info,
  Play,
  ShieldCheck,
  Wrench,
  Zap,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Badge, Button } from 'ui'

import { getKnownIssueInfo, type KnownIssueInfo } from './IssueDetail.utils'

interface RemediationConfig {
  icon: typeof ShieldCheck
  color: string
  description: string
  sql?: string
}

const knownRemediations: Record<string, RemediationConfig> = {
  enable_rls: {
    icon: ShieldCheck,
    color: 'text-brand',
    description: 'Enable Row Level Security on the table',
    sql: 'ALTER TABLE {schema}.{table} ENABLE ROW LEVEL SECURITY;',
  },
  create_index: {
    icon: Zap,
    color: 'text-warning-600',
    description: 'Create an index to improve query performance',
    sql: 'CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_{table}_{column} ON {schema}.{table} ({column});',
  },
  drop_duplicate_index: {
    icon: Wrench,
    color: 'text-foreground-lighter',
    description: 'Drop the duplicate index',
    sql: 'DROP INDEX IF EXISTS {schema}.{index_name};',
  },
  set_search_path: {
    icon: ShieldCheck,
    color: 'text-brand',
    description: 'Set search_path on the function',
    sql: "ALTER FUNCTION {schema}.{function}() SET search_path = '';",
  },
}

function RemediationActionCard({
  action,
  issue,
  onApply,
}: {
  action: SuggestedAction
  issue: AdvisorIssue
  onApply: (action: SuggestedAction) => void
}) {
  const [showSql, setShowSql] = useState(false)

  if (action.type === 'link' && action.url) {
    return (
      <a
        href={action.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-lg border border-default hover:bg-surface-100 transition-colors"
      >
        <ExternalLink className="h-4 w-4 text-foreground-lighter shrink-0" />
        <div className="flex-1">
          <p className="text-sm">{action.label}</p>
          <p className="text-xs text-foreground-muted truncate">{action.url}</p>
        </div>
        <Badge variant="default" className="text-xs shrink-0">
          Docs
        </Badge>
      </a>
    )
  }

  if (action.type === 'sql' && action.sql) {
    return (
      <div className="rounded-lg border border-default p-3 space-y-2">
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4 text-foreground-lighter shrink-0" />
          <div className="flex-1">
            <p className="text-sm">{action.label}</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <Button
              type="outline"
              size="tiny"
              onClick={() => setShowSql(!showSql)}
              icon={<Code className="h-3 w-3" />}
            >
              {showSql ? 'Hide SQL' : 'Show SQL'}
            </Button>
            <Button
              type="primary"
              size="tiny"
              onClick={() => onApply(action)}
              icon={<Play className="h-3 w-3" />}
            >
              Apply
            </Button>
          </div>
        </div>
        {showSql && (
          <pre className="text-xs font-mono bg-surface-200 rounded p-2 overflow-x-auto whitespace-pre-wrap">
            {action.sql}
          </pre>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 p-3 rounded-lg border border-default hover:bg-surface-100 transition-colors">
      <Info className="h-4 w-4 text-foreground-lighter shrink-0" />
      <p className="text-sm flex-1">{action.label}</p>
    </div>
  )
}

function KnownIssueActionsCard({ info }: { info: KnownIssueInfo }) {
  return (
    <div className="space-y-2">
      <h4 className="text-xs text-foreground-lighter">Quick Actions</h4>
      <Link
        href={info.navLink}
        className="flex items-center gap-2 p-3 rounded-lg border border-default hover:bg-surface-100 transition-colors"
      >
        <ArrowRight className="h-4 w-4 text-foreground-lighter shrink-0" />
        <p className="text-sm flex-1">{info.navLinkText}</p>
        <Badge variant="default" className="text-xs shrink-0">
          Go
        </Badge>
      </Link>
      <a
        href={info.docsLink}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-3 rounded-lg border border-default hover:bg-surface-100 transition-colors"
      >
        <BookOpen className="h-4 w-4 text-foreground-lighter shrink-0" />
        <p className="text-sm flex-1">View Documentation</p>
        <Badge variant="default" className="text-xs shrink-0">
          Docs
        </Badge>
      </a>
    </div>
  )
}

export function IssueActions({
  issue,
  rule,
  onActionApplied,
}: {
  issue: AdvisorIssue
  rule?: AdvisorRule
  onActionApplied?: () => void
}) {
  const { ref: projectRef } = useParams()
  const updateMutation = useUpdateIssueMutation(projectRef)
  const hasActions = issue.suggested_actions.length > 0

  const knownInfo = useMemo<KnownIssueInfo | null>(() => {
    if (!rule?.name || !projectRef) return null
    return getKnownIssueInfo(rule.name, projectRef, issue.metadata)
  }, [rule?.name, projectRef, issue.metadata])

  const handleApply = async (action: SuggestedAction) => {
    const newActionsTaken = [
      ...issue.actions_taken,
      {
        type: action.type,
        label: action.label,
        taken_at: new Date().toISOString(),
        taken_by: 'user',
      },
    ]

    onActionApplied?.()
  }

  if (!hasActions && !knownInfo) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm flex items-center gap-2">
        <Wrench className="h-4 w-4" />
        Recommended Actions
      </h3>

      {knownInfo && <KnownIssueActionsCard info={knownInfo} />}

      {hasActions && (
        <div className="space-y-2">
          {issue.suggested_actions.map((action, i) => (
            <RemediationActionCard key={i} action={action} issue={issue} onApply={handleApply} />
          ))}
        </div>
      )}

      {issue.actions_taken.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs text-foreground-lighter mb-2">Actions Taken</h4>
          <div className="space-y-1">
            {issue.actions_taken.map((action, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-foreground-lighter">
                <CheckCircle2 className="h-3 w-3 text-brand" />
                <span>{action.label}</span>
                <span className="text-foreground-muted">
                  · {new Date(action.taken_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
