import { useParams } from 'common'
import { useAdvisorAlertsQuery } from 'data/advisors/alerts-query'
import { useAdvisorRulesQuery } from 'data/advisors/rules-query'
import type { AdvisorAlert, AdvisorRule, AdvisorSeverity } from 'data/advisors/types'
import {
  AlertOctagon,
  AlertTriangle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Info,
  Search,
} from 'lucide-react'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

const severityConfig: Record<
  AdvisorSeverity,
  { icon: typeof AlertOctagon; badgeVariant: 'destructive' | 'warning' | 'default' }
> = {
  critical: { icon: AlertOctagon, badgeVariant: 'destructive' },
  warning: { icon: AlertTriangle, badgeVariant: 'warning' },
  info: { icon: Info, badgeVariant: 'default' },
}

export function AlertsList() {
  const { ref: projectRef } = useParams()
  const { data: alerts, isLoading: alertsLoading } = useAdvisorAlertsQuery(projectRef)
  const { data: rules } = useAdvisorRulesQuery(projectRef)
  const [filterString, setFilterString] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const rulesMap = useMemo(() => {
    const map = new Map<string, AdvisorRule>()
    for (const r of rules ?? []) map.set(r.id, r)
    return map
  }, [rules])

  const filteredAlerts = useMemo(() => {
    const list = alerts ?? []
    if (!filterString) return list
    const q = filterString.toLowerCase()
    return list.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q)
    )
  }, [alerts, filterString])

  if (alertsLoading) return <GenericSkeletonLoader />

  const allAlerts = alerts ?? []

  return (
    <div className="flex flex-col gap-y-4">
      {allAlerts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Info className="h-8 w-8 mb-2 text-foreground-lighter" />
            <p className="text-sm font-medium text-foreground">No alerts generated yet</p>
            <p className="text-sm text-foreground-lighter mt-1 max-w-sm text-center">
              Alerts appear here when monitoring rules fire. Make sure your rules are enabled and
              pg_cron is running, or use "Run Now" on the{' '}
              <Link
                href={`/project/${projectRef}/advisors/monitoring-rules`}
                className="text-foreground underline"
              >
                Rules page
              </Link>{' '}
              to test a rule manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
            <Input
              placeholder="Search alerts"
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
            />
            <p className="text-sm text-foreground-lighter whitespace-nowrap">
              {filteredAlerts.length} alert{filteredAlerts.length !== 1 ? 's' : ''}
              {allAlerts.length > filteredAlerts.length && ` of ${allAlerts.length} total`}
            </p>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Alert</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Rule</TableHead>
                  <TableHead>Issue</TableHead>
                  <TableHead>Triggered</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlerts.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <p className="text-foreground-lighter">No matching alerts</p>
                    </TableCell>
                  </TableRow>
                )}
                {filteredAlerts.map((alert) => {
                  const sev = severityConfig[alert.severity] ?? severityConfig.info
                  const SeverityIcon = sev.icon
                  const isExpanded = expandedId === alert.id
                  const ruleName = alert.rule_id
                    ? rulesMap.get(alert.rule_id)?.title ?? 'Unknown rule'
                    : '—'

                  return (
                    <>
                      <TableRow
                        key={alert.id}
                        className="cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : alert.id)}
                      >
                        <TableCell className="w-8">
                          {isExpanded ? (
                            <ChevronDown className="h-3 w-3 text-foreground-lighter" />
                          ) : (
                            <ChevronRight className="h-3 w-3 text-foreground-lighter" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <SeverityIcon className="h-4 w-4 shrink-0 text-foreground-lighter" />
                            <span className="text-sm">{alert.title}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={sev.badgeVariant}>{alert.severity}</Badge>
                        </TableCell>
                        <TableCell className="capitalize text-foreground-lighter">
                          {alert.category}
                        </TableCell>
                        <TableCell className="text-foreground-lighter text-xs">
                          {ruleName}
                        </TableCell>
                        <TableCell>
                          {alert.issue_id ? (
                            <Button type="text" size="tiny" asChild className="p-0">
                              <Link href={`/project/${projectRef}/advisors/issues/${alert.issue_id}`}>
                                <ExternalLink className="h-3 w-3 mr-1" />
                                View
                              </Link>
                            </Button>
                          ) : (
                            <span className="text-foreground-muted text-xs">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <TimestampInfo
                            className="text-sm"
                            utcTimestamp={alert.triggered_at}
                            labelFormat="D MMM, YYYY HH:mm"
                          />
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow key={`${alert.id}-detail`}>
                          <TableCell colSpan={7} className="bg-surface-200">
                            <AlertDetail alert={alert} ruleName={ruleName} />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        </>
      )}
    </div>
  )
}

function AlertDetail({ alert, ruleName }: { alert: AdvisorAlert; ruleName: string }) {
  const snapshot = alert.signal_snapshot
  const queryResults = snapshot?.query_results

  return (
    <div className="flex flex-col gap-3 py-2 px-4">
      {alert.description && (
        <div>
          <p className="text-xs font-medium text-foreground-lighter mb-1">Description</p>
          <p className="text-sm text-foreground whitespace-pre-wrap">{alert.description}</p>
        </div>
      )}
      {queryResults && (
        <div>
          <p className="text-xs font-medium text-foreground-lighter mb-1">Query Results</p>
          <pre className="text-xs bg-surface-100 rounded p-3 overflow-auto max-h-64">
            {typeof queryResults === 'string'
              ? queryResults
              : JSON.stringify(queryResults, null, 2)}
          </pre>
        </div>
      )}
      <div className="flex gap-4 text-xs text-foreground-lighter">
        <span>Rule: {ruleName}</span>
        <span>Alert ID: {alert.id}</span>
      </div>
    </div>
  )
}
