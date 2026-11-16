import { useQuery } from '@tanstack/react-query'
import { useParams } from 'common'
import dayjs from 'dayjs'
import { BellIcon, ExternalLinkIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge, Button, Tabs, TabsContent, TabsList, TabsTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { AlertIssueComments } from './AlertIssueComments'
import { AlertIssueLogEvents } from './AlertIssueLogEvents'
import { AlertIssueNotebook } from './AlertIssueNotebook'
import {
  ALERT_ISSUE_ACTION_LABELS,
  ALERT_ISSUE_STATUS_LABELS,
  getAlertIssueActions,
  getIdentifierEntries,
  getSnoozeUntil,
} from './AlertIssues.utils'
import {
  ExplorerToolbar,
  ExplorerToolbarIcon,
  ExplorerToolbarTitle,
} from '@/components/interfaces/Explorer/ExplorerToolbar'
import { Markdown } from '@/components/interfaces/Markdown'
import { AlertError } from '@/components/ui/AlertError'
import {
  useAlertIssueActionMutation,
  type AlertIssueAction,
} from '@/data/alert-issues/alert-issue-action-mutation'
import type { AlertIssue } from '@/data/alert-issues/alert-issue.schema'
import { alertIssuesQueryOptions } from '@/data/alert-issues/alert-issues-query'

type AlertIssueDetailViewProps = {
  issue: AlertIssue
  onAction: (action: AlertIssueAction) => void
  isUpdating?: boolean
  investigation?: ReactNode
  comments?: ReactNode
  children?: ReactNode
}

const metadataText = (metadata: AlertIssue['metadata'], key: string) =>
  typeof metadata[key] === 'string' ? metadata[key] : undefined

export const AlertIssueDetailView = ({
  issue,
  onAction,
  isUpdating = false,
  investigation,
  comments,
  children,
}: AlertIssueDetailViewProps) => {
  const metadataDetail = metadataText(issue.metadata, 'detail')
  const detail = metadataDetail !== issue.description ? metadataDetail : undefined
  const remediation = metadataText(issue.metadata, 'remediation')
  const remediationUrl = remediation?.startsWith('https://') ? remediation : undefined
  const identifiers = getIdentifierEntries(issue.identifiers)
  const signalSummary = `${issue.signal_count} ${issue.signal_count === 1 ? 'signal' : 'signals'}, last ${dayjs(issue.last_seen_at).fromNow()}`

  return (
    <div className="flex h-full flex-col bg-card">
      <ExplorerToolbar aria-label="Alert issue toolbar" className="md:h-(--header-height)">
        <ExplorerToolbarIcon>
          <BellIcon size={16} strokeWidth={2} />
        </ExplorerToolbarIcon>
        <ExplorerToolbarTitle className="text-foreground-light">{issue.title}</ExplorerToolbarTitle>
        <div className="ml-auto flex items-center gap-2">
          {getAlertIssueActions(issue.status).map((action) => (
            <Button
              key={action}
              variant="default"
              size="tiny"
              disabled={isUpdating}
              onClick={() => onAction(action)}
            >
              {ALERT_ISSUE_ACTION_LABELS[action]}
            </Button>
          ))}
        </div>
      </ExplorerToolbar>
      <div className="min-h-0 flex-1 overflow-y-auto">
        <article className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 pb-16 pt-12">
          <header className="flex flex-col gap-2">
            <h1 className="text-2xl text-foreground">{issue.title}</h1>
            <div className="flex flex-wrap items-center gap-2 text-sm text-foreground-light">
              <Badge>{ALERT_ISSUE_STATUS_LABELS[issue.status]}</Badge>
              <span className="capitalize">{issue.severity}</span>
              <span aria-hidden className="text-foreground-muted">
                ·
              </span>
              <span className="capitalize">{issue.category}</span>
              <span aria-hidden className="text-foreground-muted">
                ·
              </span>
              <span>{signalSummary}</span>
            </div>
          </header>
          <Tabs defaultValue="overview" className="flex flex-col gap-6">
            <TabsList className="gap-5">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="mt-0 flex flex-col gap-6">
              {issue.description && (
                <section aria-label="Description">
                  <Markdown
                    content={issue.description}
                    className="max-w-none text-foreground-light"
                  />
                </section>
              )}
              {(detail || remediationUrl) && (
                <section aria-label="Detail" className="flex flex-col gap-2">
                  {detail && <p className="text-sm text-foreground-light">{detail}</p>}
                  {remediationUrl && (
                    <a
                      href={remediationUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-sm text-brand hover:underline"
                    >
                      View remediation
                      <ExternalLinkIcon size={12} aria-hidden />
                    </a>
                  )}
                </section>
              )}
              {investigation}
              {children}
              {comments}
            </TabsContent>
            <TabsContent value="metadata" className="mt-0 flex flex-col gap-6">
              <section aria-label="Identifiers" className="flex flex-col gap-2">
                <h2 className="text-sm text-foreground">Identifiers</h2>
                <dl className="grid grid-cols-[max-content_1fr] gap-x-6 gap-y-1 font-mono text-xs">
                  {identifiers.map(([key, value]) => (
                    <div key={key} className="contents">
                      <dt className="text-foreground-lighter">{key}</dt>
                      <dd className="break-all text-foreground">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <section aria-label="Metadata" className="flex flex-col gap-2">
                <h2 className="text-sm text-foreground">Metadata</h2>
                <pre className="overflow-x-auto rounded-md bg-surface-200 p-3 text-xs text-foreground-light">
                  {JSON.stringify(issue.metadata, null, 2)}
                </pre>
              </section>
            </TabsContent>
          </Tabs>
        </article>
      </div>
    </div>
  )
}

export const AlertIssueDetail = () => {
  const { ref, alertIssueId } = useParams()
  const { data, error, isPending, isError } = useQuery(alertIssuesQueryOptions({ projectRef: ref }))
  const { mutate, isPending: isUpdating } = useAlertIssueActionMutation()
  const issue = data?.find((item) => item.alert_issue_id === alertIssueId)

  const handleAction = (action: AlertIssueAction) => {
    if (!ref || !alertIssueId) return
    mutate({
      projectRef: ref,
      alertIssueId,
      action,
      ...(action === 'snooze' && { until: getSnoozeUntil(new Date(), 1) }),
    })
  }

  if (isPending) return <GenericSkeletonLoader className="p-6" />
  if (isError) return <AlertError error={error} subject="Failed to retrieve alert issue" />
  if (!issue) {
    return (
      <div className="flex h-full items-center justify-center bg-card p-6">
        <Admonition
          type="default"
          className="max-w-md"
          title="Alert issue not found"
          description="It may be older than 7 days, or the link points to another project."
        />
      </div>
    )
  }

  return (
    <AlertIssueDetailView
      issue={issue}
      onAction={handleAction}
      isUpdating={isUpdating}
      investigation={ref && <AlertIssueNotebook issue={issue} projectRef={ref} />}
      comments={ref && <AlertIssueComments projectRef={ref} alertIssueId={issue.alert_issue_id} />}
    >
      {ref && <AlertIssueLogEvents projectRef={ref} alertIssueId={issue.alert_issue_id} />}
    </AlertIssueDetailView>
  )
}
