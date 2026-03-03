import { useParams } from 'common'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { createLintSummaryPrompt, EntityTypeIcon } from 'components/interfaces/Linter/Linter.utils'
import { useQueryPerformanceQuery } from 'components/interfaces/Reports/Reports.queries'
import { SIDEBAR_KEYS } from 'components/layouts/ProjectLayout/LayoutSidebar/LayoutSidebarProvider'
import { AiAssistantDropdown } from 'components/ui/AiAssistantDropdown'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { Lint, useProjectLintsQuery } from 'data/lint/lint-query'
import { useTrack } from 'lib/telemetry/track'
import { Activity, ExternalLink, Shield } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useMemo, useState } from 'react'
import { useAdvisorStateSnapshot } from 'state/advisor-state'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'
import { useSidebarManagerSnapshot } from 'state/sidebar-manager-state'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
} from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

interface SlowQuery {
  rolname: string
  mean_time: number
  calls: number
  query: string
}

export const AdvisorWidget = () => {
  const { ref: projectRef } = useParams()
  const [selectedTab, setSelectedTab] = useState<'security' | 'performance'>('security')
  const { data: lints, isPending: isLoadingLints } = useProjectLintsQuery({ projectRef })
  const { data: slowestQueriesData, isLoading: isLoadingSlowestQueries } = useQueryPerformanceQuery(
    {
      preset: 'slowestExecutionTime',
    }
  )
  const snap = useAiAssistantStateSnapshot()
  const { openSidebar } = useSidebarManagerSnapshot()
  const { setSelectedItem } = useAdvisorStateSnapshot()
  const track = useTrack()

  const securityLints = useMemo(
    () => (lints ?? []).filter((lint: Lint) => lint.categories.includes('SECURITY')),
    [lints]
  )
  const performanceLints = useMemo(
    () => (lints ?? []).filter((lint: Lint) => lint.categories.includes('PERFORMANCE')),
    [lints]
  )

  const securityErrorCount = securityLints.filter(
    (lint: Lint) => lint.level === LINTER_LEVELS.ERROR
  ).length
  const securityWarningCount = securityLints.filter(
    (lint: Lint) => lint.level === LINTER_LEVELS.WARN
  ).length
  const performanceErrorCount = performanceLints.filter(
    (lint: Lint) => lint.level === LINTER_LEVELS.ERROR
  ).length
  const performanceWarningCount = performanceLints.filter(
    (lint: Lint) => lint.level === LINTER_LEVELS.WARN
  ).length

  const top5SlowestQueries = useMemo(
    () => ((slowestQueriesData ?? []) as SlowQuery[]).slice(0, 5),
    [slowestQueriesData]
  )

  const handleLintClick = useCallback(
    (lint: Lint) => {
      setSelectedItem(lint.cache_key, 'lint')
      openSidebar(SIDEBAR_KEYS.ADVISOR_PANEL)
    },
    [setSelectedItem, openSidebar]
  )

  const totalIssues =
    securityErrorCount + securityWarningCount + performanceErrorCount + performanceWarningCount
  const hasErrors = securityErrorCount > 0 || performanceErrorCount > 0
  const hasWarnings = securityWarningCount > 0 || performanceWarningCount > 0

  let titleContent: React.ReactNode

  if (totalIssues === 0) {
    titleContent = <h2>No issues available</h2>
  } else {
    const issuesText = totalIssues === 1 ? 'issue' : 'issues'
    const numberDisplay = totalIssues.toString()

    let attentionClassName = ''
    if (hasErrors) {
      attentionClassName = 'text-destructive'
    } else if (hasWarnings) {
      attentionClassName = 'text-warning'
    }

    titleContent = (
      <h2>
        {numberDisplay} {issuesText} need
        {totalIssues === 1 ? 's' : ''} <span className={attentionClassName}>attention</span>
      </h2>
    )
  }

  const renderLintTabContent = (
    title: string,
    lints: Lint[],
    errorCount: number,
    warningCount: number,
    isLoading: boolean
  ) => {
    const topIssues = lints
      .filter((lint) => lint.level === LINTER_LEVELS.ERROR || lint.level === LINTER_LEVELS.WARN)
      .sort((a, b) => (a.level === LINTER_LEVELS.ERROR ? -1 : 1))

    return (
      <div className="h-full">
        {isLoading && (
          <div className="flex flex-col p-4 gap-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}
        {!isLoading && (errorCount > 0 || warningCount > 0) && (
          <ul>
            {topIssues.map((lint) => {
              const lintText = lint.detail ? lint.detail : lint.title
              return (
                <li
                  key={lint.cache_key}
                  className="text-sm w-full border-b my-0 last:border-b-0 group px-4 "
                >
                  <div className="flex items-center justify-between w-full group">
                    <button
                      onClick={() => handleLintClick(lint)}
                      className="flex items-center gap-2 transition truncate flex-1 min-w-0 py-3 text-left"
                    >
                      <EntityTypeIcon type={lint.metadata?.type} />
                      <p className="flex-1 font-mono text-xs leading-6 text-xs text-foreground-light group-hover:text-foreground truncate">
                        {lintText.replace(/\\`/g, '`')}
                      </p>
                    </button>
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        e.preventDefault()
                      }}
                      className="opacity-0 group-hover:opacity-100"
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
                        telemetrySource="advisor_widget"
                        type="text"
                        className="px-1 w-7"
                      />
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
        {!isLoading && errorCount === 0 && warningCount === 0 && (
          <div className="flex-1 flex flex-col h-full items-center justify-center gap-2">
            <Shield size={20} strokeWidth={1.5} className="text-foreground-muted" />
            <p className="text-sm text-foreground-light">No {title.toLowerCase()} issues found</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="@container">
      {isLoadingLints ? (
        <ShimmeringLoader className="w-96 mb-6" />
      ) : (
        <div className="flex justify-between items-center mb-6">{titleContent}</div>
      )}
      <div className="grid grid-cols-1 @xl:grid-cols-2 gap-4">
        <Card className="h-80">
          <Tabs value={selectedTab} className="h-full flex flex-col">
            <CardHeader className="h-10 py-0 pl-4 pr-2 flex flex-row items-center justify-between flex-0">
              <TabsList className="flex justify-start rounded-none gap-x-4 border-b-0 !mt-0 pt-0">
                <TabsTrigger
                  value="security"
                  onClick={() => setSelectedTab('security')}
                  className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
                >
                  Security{' '}
                  {securityErrorCount + securityWarningCount > 0 && (
                    <div className="rounded bg-warning text-warning-100 px-1">
                      {securityErrorCount + securityWarningCount}
                    </div>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="performance"
                  onClick={() => setSelectedTab('performance')}
                  className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
                >
                  Performance{' '}
                  {performanceErrorCount + performanceWarningCount > 0 && (
                    <div className="rounded bg-warning text-warning-100 px-1">
                      {performanceErrorCount + performanceWarningCount}
                    </div>
                  )}
                </TabsTrigger>
              </TabsList>
              <ButtonTooltip
                asChild
                type="text"
                className="!mt-0 w-7"
                icon={<ExternalLink />}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: `Open ${selectedTab} Advisor`,
                    className: 'capitalize',
                  },
                }}
              >
                <Link href={`/project/${projectRef}/advisors/${selectedTab}`} />
              </ButtonTooltip>
            </CardHeader>
            <CardContent className="!p-0 mt-0 flex-1 overflow-y-auto">
              <TabsContent value="security" className="p-0 mt-0 h-full">
                {renderLintTabContent(
                  'Security',
                  securityLints,
                  securityErrorCount,
                  securityWarningCount,
                  isLoadingLints
                )}
              </TabsContent>
              <TabsContent value="performance" className="p-0 mt-0 h-full">
                {renderLintTabContent(
                  'Performance',
                  performanceLints,
                  performanceErrorCount,
                  performanceWarningCount,
                  isLoadingLints
                )}
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>

        <Card className="h-80 flex flex-col">
          <CardHeader className="h-10 flex-row items-center justify-between py-0 pl-4 pr-2">
            <CardTitle>Slow Queries</CardTitle>
            <ButtonTooltip
              asChild
              type="text"
              className="!mt-0 w-7"
              icon={<ExternalLink />}
              tooltip={{
                content: {
                  side: 'bottom',
                  text: `Open Query Performance Advisor`,
                },
              }}
            >
              <Link href={`/project/${projectRef}/reports/query-performance`} />
            </ButtonTooltip>
          </CardHeader>
          <CardContent className="!p-0 flex-1 overflow-y-auto">
            {isLoadingSlowestQueries ? (
              <div className="space-y-2 p-4">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : top5SlowestQueries.length === 0 ? (
              <div className="flex-1 flex flex-col h-full items-center justify-center gap-2">
                <Activity strokeWidth={1.5} size={20} className="text-foreground-muted" />
                <p className="text-sm text-foreground-light">
                  No slow queries found in the selected period
                </p>
              </div>
            ) : (
              <Table className="text-xs font-mono max-w-full">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                      Query
                    </TableHead>
                    <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                      Avg time
                    </TableHead>
                    <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                      Calls
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Added explicit types for map parameters */}
                  {top5SlowestQueries.map((query: SlowQuery, i: number) => (
                    <TableRow key={i} className="py-2">
                      <TableCell className="font-mono truncate max-w-xs">{query.query}</TableCell>

                      <TableCell className="font-mono truncate max-w-xs">
                        {typeof query.mean_time === 'number'
                          ? `${(query.mean_time / 1000).toFixed(2)}s`
                          : 'N/A'}
                      </TableCell>
                      <TableCell className="font-mono truncate max-w-xs">{query.calls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
