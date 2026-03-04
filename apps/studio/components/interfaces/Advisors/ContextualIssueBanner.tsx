import { useParams } from 'common'
import { useAdvisorIssuesQuery } from 'data/advisors/issues-query'
import type { AdvisorIssue } from 'data/advisors/types'
import { AlertOctagon, AlertTriangle, ChevronRight, Info, Lightbulb } from 'lucide-react'
import Link from 'next/link'
import { Badge, Button } from 'ui'

interface ContextualIssueBannerProps {
  category?: string
  maxIssues?: number
}

const severityIcons = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  info: Info,
}

const severityColors = {
  critical: 'border-destructive-500/30 bg-destructive-200/20',
  warning: 'border-warning-500/30 bg-warning-200/20',
  info: 'border-foreground-lighter/20 bg-surface-100',
}

export function ContextualIssueBanner({
  category,
  maxIssues = 3,
}: ContextualIssueBannerProps) {
  const { ref: projectRef } = useParams()
  const { data: allIssues } = useAdvisorIssuesQuery(projectRef, {
    enabled: !!projectRef,
  })

  const openIssues = (allIssues ?? []).filter(
    (i) =>
      ['open', 'acknowledged'].includes(i.status) &&
      (!category || i.category === category)
  )

  if (openIssues.length === 0) return null

  const displayIssues = openIssues.slice(0, maxIssues)
  const remaining = openIssues.length - displayIssues.length
  const highestSeverity = openIssues.some((i) => i.severity === 'critical')
    ? 'critical'
    : openIssues.some((i) => i.severity === 'warning')
      ? 'warning'
      : 'info'

  return (
    <div
      className={`mx-4 mt-3 rounded-lg border p-3 ${severityColors[highestSeverity as keyof typeof severityColors]}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-foreground-lighter" />
        <span className="text-xs font-medium text-foreground-light">
          {openIssues.length} advisor issue{openIssues.length !== 1 ? 's' : ''} detected
        </span>
      </div>
      <div className="space-y-1">
        {displayIssues.map((issue) => {
          const Icon = severityIcons[issue.severity] ?? Info
          return (
            <Link
              key={issue.id}
              href={`/project/${projectRef}/advisors/issues/${issue.id}`}
              className="flex items-center gap-2 py-1 text-xs hover:text-foreground transition-colors"
            >
              <Icon className="h-3 w-3 shrink-0" />
              <span className="flex-1 truncate">{issue.title}</span>
              <Badge
                variant={
                  issue.severity === 'critical'
                    ? 'destructive'
                    : issue.severity === 'warning'
                      ? 'warning'
                      : 'default'
                }
                className="text-xs"
              >
                {issue.severity}
              </Badge>
            </Link>
          )
        })}
      </div>
      {remaining > 0 && (
        <Link
          href={`/project/${projectRef}/advisors/issues`}
          className="mt-2 inline-flex items-center gap-1 text-xs text-foreground-lighter hover:text-foreground"
        >
          +{remaining} more
          <ChevronRight className="h-3 w-3" />
        </Link>
      )}
    </div>
  )
}
