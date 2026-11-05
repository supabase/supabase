import { useFlag, useParams } from 'common'
import { CheckCircle2Icon, CopyIcon } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { AiIconAnimation, Badge, Button, Card, CardContent, cn, copyToClipboard } from 'ui'
import { Row } from 'ui-patterns/Row'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { HomeCard } from './HomeCard'
import {
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  SEVERITY_DOT_CLASSES,
  SEVERITY_LABELS,
} from '@/components/interfaces/Issues/Issues.constants'
import {
  buildIssuePrompt,
  getIssueTelemetryProperties,
  summarizeAffected,
} from '@/components/interfaces/Issues/Issues.utils'
import { SIDEBAR_KEYS } from '@/components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import type { Issue } from '@/data/issues/issue.types'
import { useProjectIssues } from '@/data/issues/useProjectIssues'
import { useTrack } from '@/lib/telemetry/track'
import { useAiAssistantStateSnapshot } from '@/state/ai-assistant-state'
import { useSidebarManagerSnapshot } from '@/state/sidebar-manager-state'

const MAX_HOMEPAGE_ISSUES = 4

export const IssuesSection = ({ showEmptyState = false }: { showEmptyState?: boolean }) => {
  const { ref: projectRef } = useParams()
  const isHealthAdvisorInHomepageEnabled = useFlag('healthAdvisorInHomepage')
  const { issues, error, isLoading, isError, isSuccess, refetch } = useProjectIssues({
    projectRef,
    enabled: !showEmptyState,
    includeHealth: isHealthAdvisorInHomepageEnabled,
  })

  return (
    <section aria-labelledby="home-issues-heading">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h2 id="home-issues-heading">Issues</h2>
          {isSuccess && <Badge>{issues.length.toLocaleString()} open</Badge>}
        </div>
        <Button asChild variant="default">
          <Link href={`/project/${projectRef}/issues`}>View all issues</Link>
        </Button>
      </div>
      {isLoading && <GenericSkeletonLoader />}
      {isError && (
        <AlertError
          error={error}
          subject="Failed to retrieve issues"
          projectRef={projectRef}
          additionalActions={
            <Button variant="default" onClick={() => refetch()}>
              Retry
            </Button>
          }
        />
      )}
      {!isLoading && !isError && issues.length === 0 && <EmptyState />}
      {issues.length > 0 && (
        <Row maxColumns={4} minWidth={280}>
          {issues.slice(0, MAX_HOMEPAGE_ISSUES).map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              issuesCount={issues.length}
              projectRef={projectRef ?? ''}
            />
          ))}
        </Row>
      )}
    </section>
  )
}

const IssueCard = ({
  issue,
  issuesCount,
  projectRef,
}: {
  issue: Issue
  issuesCount: number
  projectRef: string
}) => {
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const CategoryIcon = CATEGORY_ICONS[issue.category]
  const affectedSummary = summarizeAffected(issue.affected)

  const handleOpenIssue = () => {
    track('advisor_detail_opened', {
      origin: 'homepage',
      advisorSource: issue.source,
      ...getIssueTelemetryProperties(issue),
    })
  }

  const handleAskAssistant = () => {
    track('advisor_assistant_button_clicked', {
      origin: 'homepage',
      issuesCount,
      ...getIssueTelemetryProperties(issue),
    })
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    snap.newChat({ name: issue.title, initialMessage: buildIssuePrompt(issue) })
  }

  const handleCopyIssue = () => {
    track('ai_prompt_copied', { source: 'advisor_section' })
    copyToClipboard(buildIssuePrompt(issue))
    toast.success('Issue copied for your agent')
  }

  return (
    <HomeCard
      href={`/project/${projectRef}/issues/${issue.id}`}
      onClick={handleOpenIssue}
      icon={<CategoryIcon size={16} strokeWidth={1.5} className="text-foreground-light" />}
      label={CATEGORY_LABELS[issue.category]}
      title={issue.title}
      meta={
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className={cn('size-1.5 rounded-full', SEVERITY_DOT_CLASSES[issue.severity])} />
            {SEVERITY_LABELS[issue.severity]}
          </span>
          {affectedSummary && <span className="truncate">· {affectedSummary}</span>}
        </span>
      }
      actions={
        <>
          <ButtonTooltip
            variant="text"
            className="size-7 px-0"
            icon={<AiIconAnimation size={16} />}
            aria-label={`Ask Assistant about ${issue.title}`}
            tooltip={{ content: { text: 'Ask Assistant' } }}
            onClick={handleAskAssistant}
          />
          <ButtonTooltip
            variant="text"
            className="size-7 px-0"
            icon={<CopyIcon size={16} />}
            aria-label={`Copy ${issue.title} for your agent`}
            tooltip={{ content: { text: 'Copy issue for your agent' } }}
            onClick={handleCopyIssue}
          />
        </>
      }
    />
  )
}

const EmptyState = () => (
  <Card className="h-64 bg-transparent">
    <CardContent className="flex h-full flex-col items-center justify-center gap-2 p-8">
      <CheckCircle2Icon size={20} strokeWidth={1.5} className="text-foreground-muted" />
      <p className="text-center text-sm text-foreground-light">No open issues</p>
    </CardContent>
  </Card>
)
