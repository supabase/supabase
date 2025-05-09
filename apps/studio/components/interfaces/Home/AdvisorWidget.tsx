import Link from 'next/link'
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react'
import { useMemo } from 'react'

import { useProjectLintsQuery, Lint } from 'data/lint/lint-query'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
import { EntityTypeIcon, lintInfoMap } from 'components/interfaces/Linter/Linter.utils'
import {
  QueryPerformanceSort,
  useQueryPerformanceQuery,
} from 'components/interfaces/Reports/Reports.queries'
import { QUERY_PERFORMANCE_REPORT_TYPES } from 'components/interfaces/QueryPerformance/QueryPerformance.constants'
import {
  cn,
  Tabs_Shadcn_ as Tabs,
  TabsContent_Shadcn_ as TabsContent,
  TabsList_Shadcn_ as TabsList,
  TabsTrigger_Shadcn_ as TabsTrigger,
  Badge,
  Button,
  Card,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  CardHeader,
  CardTitle,
  CardContent,
  AiIconAnimation,
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { useAiAssistantStateSnapshot } from 'state/ai-assistant-state'

interface AdvisorWidgetProps {
  projectRef: string
}

interface SlowQuery {
  rolname: string
  avg_time: number
  calls: number
  query: string
}

const AdvisorWidget = ({ projectRef }: AdvisorWidgetProps) => {
  const { data: lints, isLoading: isLoadingLints } = useProjectLintsQuery({ projectRef })
  const { data: slowestQueriesData, isLoading: isLoadingSlowestQueries } = useQueryPerformanceQuery(
    {
      preset: 'slowestExecutionTime',
    }
  )
  const snap = useAiAssistantStateSnapshot()

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

  // Type assertion for the data structure
  const top5SlowestQueries = useMemo(
    () => ((slowestQueriesData ?? []) as SlowQuery[]).slice(0, 5),
    [slowestQueriesData]
  )

  const totalIssues =
    securityErrorCount + securityWarningCount + performanceErrorCount + performanceWarningCount
  const hasErrors = securityErrorCount > 0 || performanceErrorCount > 0
  const hasWarnings = securityWarningCount > 0 || performanceWarningCount > 0

  let titleContent: React.ReactNode

  if (totalIssues === 0) {
    titleContent = <h2 className="text-xl">No issues available</h2>
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
      <h2 className="text-xl">
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
      .slice(0, 5)

    return (
      <div className="h-full">
        {!isLoading && (errorCount > 0 || warningCount > 0) && (
          <ul>
            {topIssues.map((lint) => (
              <li
                key={lint.cache_key}
                className="text-sm px-4 py-3 w-full border-b my-0 last:border-b-0 group"
              >
                <div className="flex items-center justify-between w-full">
                  <Link
                    href={`/project/${projectRef}/advisors/${title.toLowerCase()}?id=${lint.cache_key}`}
                    className="flex items-center gap-2 text-foreground-light hover:text-foreground transition truncate flex-1 min-w-0"
                  >
                    <EntityTypeIcon type={lint.metadata?.type} />
                    <div className="flex-1 truncate min-w-0">
                      {lint.detail ? lint.detail : lint.title}
                    </div>
                  </Link>
                  <Button
                    type="text"
                    className="px-1 opacity-0 group-hover:opacity-100"
                    icon={<AiIconAnimation className="w-5 h-5" />}
                    onClick={(e) => {
                      e.stopPropagation()
                      e.preventDefault()
                      snap.newChat({
                        name: 'Summarize lint',
                        open: true,
                        initialInput: `Summarize the issue and suggest fixes for the following lint item:
Title: ${lintInfoMap.find((item) => item.name === lint.name)?.title ?? lint.title}
Entity: ${(lint.metadata && (lint.metadata.entity || (lint.metadata.schema && lint.metadata.name && `${lint.metadata.schema}.${lint.metadata.name}`))) ?? 'N/A'}
Schema: ${lint.metadata?.schema ?? 'N/A'}
Issue Details: ${lint.detail ? lint.detail.replace(/\`/g, '`') : 'N/A'}
Description: ${lint.description ? lint.description.replace(/\`/g, '`') : 'N/A'}`,
                      })
                    }}
                  />
                </div>
              </li>
            ))}
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
    <div>
      {isLoadingLints ? (
        <ShimmeringLoader className="w-96" />
      ) : (
        <div className="flex justify-between items-center mb-6">{titleContent}</div>
      )}
      <Tabs defaultValue="security" className="mt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="h-80">
            <Tabs defaultValue="security" className="h-full flex flex-col">
              <CardHeader className="py-0 px-4 flex flex-row items-center justify-between flex-0">
                <TabsList className="flex justify-start rounded-none gap-4 border-b-0 !mt-0 pt-0">
                  <TabsTrigger
                    value="security"
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
            <CardHeader className="py-3 px-4">
              <CardTitle>Slow Queries</CardTitle>
            </CardHeader>
            <CardContent className="!p-0 flex-1 overflow-y-auto">
              {isLoadingSlowestQueries ? (
                <div className="space-y-2">
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
                      <TableRow key={i}>
                        <TableCell className="font-mono truncate max-w-xs py-2">
                          {query.query}
                        </TableCell>

                        <TableCell className="font-mono truncate max-w-xs py-2">
                          {typeof query.avg_time === 'number'
                            ? `${query.avg_time.toFixed(2)}ms`
                            : 'N/A'}
                        </TableCell>
                        <TableCell className="font-mono truncate max-w-xs py-2">
                          {query.calls}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </Tabs>
    </div>
  )
}

export default AdvisorWidget
