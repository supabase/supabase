import type { AdvisorIssue, Project, ProjectOverview } from '@supabase/mcp-server-supabase/apps'
import { CircleAlertIcon, CircleCheckIcon, TriangleAlertIcon } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'
import { Button, Card } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { errorMessage, type AskAgent, type Loadable } from '../common'

export const ADVISOR_CATEGORIES = { security: 'Security', performance: 'Performance' } as const
export type AdvisorCategory = keyof typeof ADVISOR_CATEGORIES
const CATEGORIES = Object.keys(ADVISOR_CATEGORIES) as AdvisorCategory[]

/** The server returns at most this many issue types per category. */
const ADVISOR_ISSUE_LIMIT = 20

/** The advisor sections of a project overview. */
export type ProjectIssues = Pick<ProjectOverview, AdvisorCategory>

export interface IssuesListProps {
  project: Project
  /** The host's read of the project's advisors. `idle` when the connection has none. */
  issues: Loadable<ProjectIssues>
  /** Asks the host to load the issues again. Omit to hide Refresh. */
  onRefresh?: () => void
  /** Sends one issue to the agent to review. Omit when the host cannot; Review is disabled. */
  onAsk?: AskAgent
}

function IssueRow({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title?: string
  description: string
  action?: ReactNode
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 border-b border-muted px-4 py-3 last:border-b-0">
      {icon && <span className="flex shrink-0">{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        {title && <span className="truncate text-sm text-foreground">{title}</span>}
        <span className="text-xs text-foreground-light">{description}</span>
      </span>
      {action}
    </li>
  )
}

const levelLabel = (level: AdvisorIssue['level']) => (level === 'ERROR' ? 'Error' : 'Warning')

function CategoryRows({
  category,
  issues,
  canReview,
  onReview,
}: {
  category: AdvisorCategory
  issues: ProjectIssues
  canReview: boolean
  onReview: (category: AdvisorCategory, issue: AdvisorIssue) => void
}) {
  const label = ADVISOR_CATEGORIES[category]
  const result = issues[category]

  // A section that failed is shown as unavailable, never as "no issues".
  if (result.status === 'unavailable')
    return <IssueRow title={label} description={result.message} />

  if (result.data.total === 0) {
    return (
      <IssueRow
        icon={<CircleCheckIcon size={16} aria-hidden="true" className="text-brand" />}
        title={`No ${label.toLowerCase()} issues`}
        description={`${label} Advisor found no warnings or errors.`}
      />
    )
  }

  return (
    <>
      {result.data.issues.map((issue) => (
        <IssueRow
          key={`${category}:${issue.name}:${issue.level}:${issue.title}`}
          icon={
            issue.level === 'ERROR' ? (
              <CircleAlertIcon size={16} aria-label="Error" className="text-destructive" />
            ) : (
              <TriangleAlertIcon size={16} aria-label="Warning" className="text-warning" />
            )
          }
          title={issue.title}
          description={`${label} · ${levelLabel(issue.level)} · ${issue.count} ${issue.count === 1 ? 'finding' : 'findings'}`}
          action={
            <Button
              variant="default"
              size="tiny"
              disabled={!canReview}
              aria-label={`Review ${issue.title}`}
              aria-description="Send this finding to chat for review."
              onClick={() => onReview(category, issue)}
            >
              Review
            </Button>
          }
        />
      ))}
      {result.data.truncated && (
        <IssueRow
          description={`Showing the first ${ADVISOR_ISSUE_LIMIT} ${label.toLowerCase()} issue types.`}
        />
      )}
    </>
  )
}

/**
 * A project's open issues from its security and performance advisors, each of which the user
 * can send to the agent to review. Renders on its own, e.g. in a chat panel, or within Home.
 */
export function IssuesList({ project, issues, onRefresh, onAsk }: IssuesListProps) {
  const [sendingId, setSendingId] = useState<string>()
  const [sendResult, setSendResult] = useState<
    { status: 'sent' } | { status: 'error'; message: string }
  >()
  const isSending = useRef(false)
  const isLoading = issues.status === 'loading'
  const canReview = !!onAsk && sendingId === undefined

  async function handleReview(category: AdvisorCategory, finding: AdvisorIssue) {
    if (!onAsk || isSending.current) return
    isSending.current = true
    setSendingId(`${category}:${finding.name}`)
    setSendResult(undefined)
    try {
      await onAsk({ type: 'review-finding', project, category, finding })
      setSendResult({ status: 'sent' })
    } catch (error) {
      setSendResult({ status: 'error', message: errorMessage(error) })
    } finally {
      isSending.current = false
      setSendingId(undefined)
    }
  }

  return (
    <section aria-labelledby="issues-title" aria-busy={isLoading} className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <h3 id="issues-title" className="text-sm text-foreground">
          Issues
        </h3>
        <div className="flex items-center gap-2">
          {/* Always rendered so the confirmation is announced. */}
          <p role="status" className="text-xs text-foreground-lighter">
            {sendResult?.status === 'sent' ? 'Sent to chat.' : ''}
          </p>
          {onRefresh && (
            <Button variant="text" size="tiny" disabled={isLoading} onClick={onRefresh}>
              Refresh
            </Button>
          )}
        </div>
      </div>
      <Card>
        <ul>
          {issues.status === 'loading' && <IssueRow description="Loading issues…" />}
          {issues.status === 'idle' && (
            <IssueRow description="Issue data is not available on this connection." />
          )}
          {issues.status === 'error' && (
            <IssueRow title="Issues are unavailable" description={issues.message} />
          )}
          {issues.status === 'success' &&
            CATEGORIES.map((category) => (
              <CategoryRows
                key={category}
                category={category}
                issues={issues.data}
                canReview={canReview}
                onReview={(category, issue) => void handleReview(category, issue)}
              />
            ))}
        </ul>
      </Card>
      {sendResult?.status === 'error' && (
        <Admonition
          type="destructive"
          title="Failed to send to chat"
          description={sendResult.message}
        />
      )}
    </section>
  )
}
