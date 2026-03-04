import { useIsAdvisorsV2Enabled } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { createLintSummaryPrompt } from 'components/interfaces/Linter/Linter.utils'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { useAdvisorIssuesQuery } from 'data/advisors/issues-query'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useTrack } from 'lib/telemetry/track'
import { AlertOctagon, AlertTriangle, ArrowRight, BarChart, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo } from 'react'
import { useAdvisorStateSnapshot } from 'state/advisor-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import { AiIconAnimation, Badge, Button, Card, CardContent, CardHeader, CardTitle } from 'ui'
import { Row } from 'ui-patterns'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { Markdown } from '../Markdown'

export const AdvisorSection = ({ showEmptyState = false }: { showEmptyState?: boolean }) => {
  const { ref: projectRef } = useParams()
  const isV2 = useIsAdvisorsV2Enabled()
  const { data: lints, isPending: isLoadingLints } = useProjectLintsQuery(
    {
      projectRef,
    },
    {
      enabled: !showEmptyState,
    }
  )
  const { data: advisorIssues } = useAdvisorIssuesQuery(projectRef, { enabled: !showEmptyState })
  const track = useTrack()
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()

  const errorLints: Lint[] = useMemo(() => {
    return lints?.filter((lint) => lint.level === LINTER_LEVELS.ERROR) ?? []
  }, [lints])

  const warnLints: Lint[] = useMemo(() => {
    return lints?.filter((lint) => lint.level === LINTER_LEVELS.WARN) ?? []
  }, [lints])

  const activeAdvisorIssues = useMemo(
    () =>
      (advisorIssues ?? []).filter((i) =>
        ['open', 'acknowledged', 'snoozed'].includes(i.status)
      ),
    [advisorIssues]
  )
  const criticalAdvisorIssues = useMemo(
    () => activeAdvisorIssues.filter((i) => i.severity === 'critical'),
    [activeAdvisorIssues]
  )

  const totalErrors = errorLints.length
  const totalFindings = isV2
    ? totalErrors + warnLints.length + activeAdvisorIssues.length
    : totalErrors

  const titleContent = useMemo(() => {
    if (isV2) {
      if (totalFindings === 0) return <h2>Advisor found no issues</h2>
      return (
        <h2>
          Advisor found {totalFindings} {totalFindings === 1 ? 'finding' : 'findings'}
        </h2>
      )
    }
    if (totalErrors === 0) return <h2>Advisor found no issues</h2>
    return (
      <h2>
        Advisor found {totalErrors} {totalErrors === 1 ? 'issue' : 'issues'}
      </h2>
    )
  }, [isV2, totalFindings, totalErrors])

  const advisorsHref = isV2
    ? `/project/${projectRef}/advisors`
    : `/project/${projectRef}/advisors/issues`

  const handleAskAssistant = useCallback(() => {
    openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
    track('advisor_assistant_button_clicked', {
      origin: 'homepage',
      issuesCount: totalErrors,
    })
  }, [track, openSidebar, totalErrors])

  const handleCardClick = useCallback(
    (lint: Lint) => {
      setSelectedItem(lint.cache_key, 'lint')
      openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
      track('advisor_detail_opened', {
        origin: 'homepage',
        advisorSource: 'lint',
        advisorCategory: lint.categories[0],
        advisorType: lint.name,
        advisorLevel: lint.level,
      })
    },
    [track, setSelectedItem, openSidebar]
  )

  if (showEmptyState) {
    return <EmptyState />
  }

  if (isV2) {
    return (
      <div>
        {isLoadingLints ? (
          <ShimmeringLoader className="w-96 mb-6" />
        ) : (
          <div className="flex justify-between items-center mb-6">
            {titleContent}
            <div className="flex items-center gap-2">
              <Button type="default" icon={<AiIconAnimation />} onClick={handleAskAssistant}>
                Ask Assistant
              </Button>
              <Button asChild type="outline" iconRight={<ArrowRight className="h-3 w-3" />}>
                <Link href={advisorsHref}>Open Advisors</Link>
              </Button>
            </div>
          </div>
        )}

        {activeAdvisorIssues.length > 0 && (
          <Link href={advisorsHref} className="block mb-4">
            <Card
              className={`${criticalAdvisorIssues.length > 0 ? 'border-destructive-500/50 bg-destructive-200/10' : 'border-warning-500/50 bg-warning-200/10'} hover:border-foreground-muted transition-colors`}
            >
              <CardContent className="flex items-center gap-3 p-3">
                {criticalAdvisorIssues.length > 0 ? (
                  <AlertOctagon className="h-4 w-4 text-destructive-600 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0" />
                )}
                <span className="text-sm text-foreground flex-1">
                  {activeAdvisorIssues.length} active advisor issue
                  {activeAdvisorIssues.length !== 1 ? 's' : ''}
                  {criticalAdvisorIssues.length > 0 &&
                    ` (${criticalAdvisorIssues.length} critical)`}
                </span>
                <ArrowRight className="h-3 w-3 text-foreground-lighter" />
              </CardContent>
            </Card>
          </Link>
        )}

        {isLoadingLints ? (
          <div className="flex flex-col p-4 gap-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : errorLints.length + warnLints.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm text-foreground-lighter">Lint findings:</span>
              {errorLints.length > 0 && (
                <Badge variant="destructive">
                  {errorLints.length} error{errorLints.length !== 1 ? 's' : ''}
                </Badge>
              )}
              {warnLints.length > 0 && (
                <Badge variant="warning">
                  {warnLints.length} warning{warnLints.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
            <Row columns={[3, 2, 1]}>
              {[...errorLints, ...warnLints].slice(0, 6).map((lint) => (
                <Card
                  key={lint.cache_key}
                  className="min-h-full flex flex-col items-stretch cursor-pointer h-64"
                  onClick={() => handleCardClick(lint)}
                >
                  <CardHeader className="border-b-0 shrink-0 flex flex-row gap-2 space-y-0 justify-between items-center">
                    <div className="flex flex-row items-center gap-3">
                      {lint.categories[0] === 'SECURITY' ? (
                        <Shield size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      ) : (
                        <BarChart size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      )}
                      <CardTitle className="text-foreground-light">{lint.categories[0]}</CardTitle>
                    </div>
                    <Badge
                      variant={lint.level === LINTER_LEVELS.ERROR ? 'destructive' : 'warning'}
                    >
                      {lint.level}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    <h3 className="mb-1">{lint.title}</h3>
                    <Markdown className="leading-6 text-sm text-foreground-light">
                      {lint.detail && lint.detail.replace(/\\`/g, '`')}
                    </Markdown>
                  </CardContent>
                </Card>
              ))}
            </Row>
          </div>
        ) : (
          <EmptyState />
        )}
      </div>
    )
  }

  return (
    <div>
      {isLoadingLints ? (
        <ShimmeringLoader className="w-96 mb-6" />
      ) : (
        <div className="flex justify-between items-center mb-6">
          {titleContent}
          <Button type="default" icon={<AiIconAnimation />} onClick={handleAskAssistant}>
            Ask Assistant
          </Button>
        </div>
      )}

      {activeAdvisorIssues.length > 0 && (
        <Link href={`/project/${projectRef}/advisors/issues`} className="block mb-4">
          <Card
            className={`${criticalAdvisorIssues.length > 0 ? 'border-destructive-500/50 bg-destructive-200/10' : 'border-warning-500/50 bg-warning-200/10'} hover:border-foreground-muted transition-colors`}
          >
            <CardContent className="flex items-center gap-3 p-3">
              {criticalAdvisorIssues.length > 0 ? (
                <AlertOctagon className="h-4 w-4 text-destructive-600 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-warning-600 shrink-0" />
              )}
              <span className="text-sm text-foreground flex-1">
                {activeAdvisorIssues.length} active advisor issue
                {activeAdvisorIssues.length !== 1 ? 's' : ''}
                {criticalAdvisorIssues.length > 0 &&
                  ` (${criticalAdvisorIssues.length} critical)`}
              </span>
              <ArrowRight className="h-3 w-3 text-foreground-lighter" />
            </CardContent>
          </Card>
        </Link>
      )}
      {isLoadingLints ? (
        <div className="flex flex-col p-4 gap-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : errorLints.length > 0 ? (
        <>
          <Row columns={[3, 2, 1]}>
            {errorLints.map((lint) => {
              return (
                <Card
                  key={lint.cache_key}
                  className="min-h-full flex flex-col items-stretch cursor-pointer h-64"
                  onClick={() => {
                    handleCardClick(lint)
                  }}
                >
                  <CardHeader className="border-b-0 shrink-0 flex flex-row gap-2 space-y-0 justify-between items-center">
                    <div className="flex flex-row items-center gap-3">
                      {lint.categories[0] === 'SECURITY' ? (
                        <Shield size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      ) : (
                        <BarChart size={16} strokeWidth={1.5} className="text-foreground-muted" />
                      )}
                      <CardTitle className="text-foreground-light">{lint.categories[0]}</CardTitle>
                    </div>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                    >
                      <AiAssistantDropdown
                        label="Ask Assistant"
                        iconOnly
                        tooltip="Help me fix this issue"
                        buildPrompt={() => createLintSummaryPrompt(lint)}
                        onOpenAssistant={() => {
                          openSidebar(SIDEBAR_KEYS.AI_ASSISTANT)
                          snap.newChat({
                            name: 'Summarize lint',
                            initialInput: createLintSummaryPrompt(lint),
                          })
                          track('advisor_assistant_button_clicked', {
                            origin: 'homepage',
                            advisorCategory: lint.categories[0],
                            advisorType: lint.name,
                            advisorLevel: lint.level,
                          })
                        }}
                        telemetrySource="advisor_section"
                        type="text"
                        className="w-7 h-7"
                      />
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 pt-16 flex flex-col justify-end flex-1 overflow-auto">
                    <h3 className="mb-1">{lint.title}</h3>
                    <Markdown className="leading-6 text-sm text-foreground-light">
                      {lint.detail && lint.detail.replace(/\\`/g, '`')}
                    </Markdown>
                  </CardContent>
                </Card>
              )
            })}
          </Row>
        </>
      ) : (
        <EmptyState />
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <Card className="bg-transparent h-64">
      <CardContent className="flex flex-col items-center justify-center gap-2 p-16 h-full">
        <Shield size={20} strokeWidth={1.5} className="text-foreground-muted" />
        <p className="text-sm text-foreground-light text-center">
          No security or performance errors found
        </p>
      </CardContent>
    </Card>
  )
}
