import Link from 'next/link'
import { AlertTriangle, Shield, Activity, Clock } from 'lucide-react'
import { useMemo } from 'react'

import { useProjectLintsQuery, Lint } from 'data/lint/lint-query'
import { LINTER_LEVELS } from 'components/interfaces/Linter/Linter.constants'
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
} from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { formatBytes } from 'lib/helpers'
import ReactMarkdown from 'react-markdown'

interface AdvisorWidgetProps {
  projectRef: string
}

// Define type for slowest queries based on usage
interface SlowQuery {
  rolname: string
  avg_time: number
  calls: number
  query: string
  // Add other potential fields if known, otherwise keep minimal
}

// Define DataPoint component locally
const DataPoint = ({
  icon,
  label,
  value,
  valueClassName,
}: {
  icon: React.ReactNode
  label: string
  value: string | number
  valueClassName?: string
}) => (
  <div className="flex items-center gap-2">
    {icon}
    <span className="text-sm text-foreground-light">{label}:</span>
    <span className={cn('text-sm font-medium', valueClassName)}>{value}</span>
  </div>
)

const AdvisorWidget = ({ projectRef }: AdvisorWidgetProps) => {
  const { data: lints, isLoading: isLoadingLints } = useProjectLintsQuery({ projectRef })
  const { data: slowestQueriesData, isLoading: isLoadingSlowestQueries } = useQueryPerformanceQuery(
    {
      projectRef: projectRef as any,
      preset: 'slowestExecutionTime',
    }
  )

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

  const renderLintTabContent = (
    title: string,
    lints: Lint[],
    errorCount: number,
    warningCount: number,
    isLoading: boolean,
    link: string
  ) => {
    const topIssues = lints
      .filter((lint) => lint.level === LINTER_LEVELS.ERROR || lint.level === LINTER_LEVELS.WARN)
      .sort((a, b) => (a.level === LINTER_LEVELS.ERROR ? -1 : 1))
      .slice(0, 5)

    return (
      <div className="p-4">
        {!isLoading && (errorCount > 0 || warningCount > 0) && (
          <div>
            <ul>
              {topIssues.map((lint) => (
                <li
                  key={lint.cache_key}
                  className="text-sm py-3 first:pt-0 truncate w-full border-b my-0 last:border-b-0"
                >
                  <Link
                    href={`/project/${projectRef}/advisors/${title.toLowerCase()}?id=${lint.cache_key}`}
                    className="flex items-center gap-2 text-foreground-light hover:text-foreground transition truncate w-full"
                  >
                    <AlertTriangle
                      size={16}
                      strokeWidth={1.5}
                      className={cn(
                        'shrink-0',
                        lint.level === LINTER_LEVELS.ERROR ? 'text-destructive' : 'text-warning'
                      )}
                    />
                    <ReactMarkdown className="truncate w-full max-w-full">
                      {lint.detail ? lint.detail : lint.title}
                    </ReactMarkdown>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
        {!isLoading && errorCount === 0 && warningCount === 0 && (
          <div className="p-4 flex items-center space-x-4 border rounded-md">
            <Shield size={20} strokeWidth={1.5} />
            <p className="text-sm text-foreground-light">No {title.toLowerCase()} issues found.</p>
          </div>
        )}
      </div>
    )
  }

  const renderQueriesTabContent = () => (
    <div>
      {isLoadingSlowestQueries ? (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : top5SlowestQueries.length === 0 ? (
        <div className="p-4 flex items-center space-x-4 border rounded-md">
          <Activity strokeWidth={1.5} size={20} />
          <p className="text-sm text-foreground-light">
            No slow queries found in the selected period.
          </p>
        </div>
      ) : (
        // Removed size="tiny" prop from Table
        <Table className="text-xs font-mono max-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="text-foreground-lighter truncate py-2 h-auto">Query</TableHead>
              <TableHead className="text-foreground-lighter truncate py-2 h-auto">
                Avg time
              </TableHead>
              <TableHead className="text-foreground-lighter truncate py-2 h-auto">Calls</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {/* Added explicit types for map parameters */}
            {top5SlowestQueries.map((query: SlowQuery, i: number) => (
              <TableRow key={i}>
                <TableCell className="font-mono truncate max-w-xs py-2">{query.query}</TableCell>

                <TableCell className="font-mono truncate max-w-xs py-2">
                  {typeof query.avg_time === 'number' ? `${query.avg_time.toFixed(2)}ms` : 'N/A'}
                </TableCell>
                <TableCell className="font-mono truncate max-w-xs py-2">{query.calls}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )

  return (
    <Card>
      <Tabs defaultValue="security">
        <CardHeader className="py-3 px-4 flex flex-row items-center py-0 justify-between">
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
            <TabsTrigger
              value="queries"
              className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
            >
              Slow Queries
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="!p-0">
          <TabsContent value="security" className="p-0 mt-0">
            {renderLintTabContent(
              'Security',
              securityLints,
              securityErrorCount,
              securityWarningCount,
              isLoadingLints,
              `/project/${projectRef}/advisors/security`
            )}
          </TabsContent>
          <TabsContent value="performance" className="p-0 mt-0">
            {renderLintTabContent(
              'Performance',
              performanceLints,
              performanceErrorCount,
              performanceWarningCount,
              isLoadingLints,
              `/project/${projectRef}/advisors/performance`
            )}
          </TabsContent>
          <TabsContent value="queries" className="p-0 mt-0">
            {renderQueriesTabContent()}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  )
}

export default AdvisorWidget
