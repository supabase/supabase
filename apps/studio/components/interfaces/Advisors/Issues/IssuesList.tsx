import { useParams } from 'common'
import { FilterPopover } from 'components/ui/FilterPopover'
import { useAdvisorIssuesQuery, useUpdateIssueMutation } from 'data/advisors/issues-query'
import type { AdvisorIssue, AdvisorSeverity, IssueStatus } from 'data/advisors/types'
import {
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Eye,
  EyeOff,
  Info,
  MoreVertical,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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

const ACTIVE_STATUSES = ['open', 'acknowledged', 'snoozed']

const STATUS_FILTER_OPTIONS = [
  { name: 'Open', value: 'open' },
  { name: 'Acknowledged', value: 'acknowledged' },
  { name: 'Snoozed', value: 'snoozed' },
  { name: 'Resolved', value: 'resolved' },
  { name: 'Dismissed', value: 'dismissed' },
]

const SEVERITY_FILTER_OPTIONS = [
  { name: 'Critical', value: 'critical' },
  { name: 'Warning', value: 'warning' },
  { name: 'Info', value: 'info' },
]

export function IssuesList() {
  const { ref: projectRef } = useParams()
  const { data: issues, isLoading } = useAdvisorIssuesQuery(projectRef)
  const updateMutation = useUpdateIssueMutation(projectRef)
  const [filteredStatuses, setFilteredStatuses] = useState<string[]>(ACTIVE_STATUSES)
  const [filteredSeverities, setFilteredSeverities] = useState<string[]>([])
  const [filterString, setFilterString] = useState('')

  const filteredIssues = useMemo(() => {
    let list = issues ?? []

    if (filteredStatuses.length > 0) {
      list = list.filter((i) => filteredStatuses.includes(i.status))
    }

    if (filteredSeverities.length > 0) {
      list = list.filter((i) => filteredSeverities.includes(i.severity))
    }

    if (filterString) {
      const q = filterString.toLowerCase()
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          i.category.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q)
      )
    }

    return list
  }, [issues, filteredStatuses, filteredSeverities, filterString])

  const activeCount = (issues ?? []).filter((i) => ACTIVE_STATUSES.includes(i.status)).length

  const hasActiveFilters =
    filterString.length > 0 ||
    filteredSeverities.length > 0 ||
    (filteredStatuses.length > 0 &&
      JSON.stringify(filteredStatuses.sort()) !== JSON.stringify([...ACTIVE_STATUSES].sort()))

  const handleResetFilters = () => {
    setFilterString('')
    setFilteredStatuses(ACTIVE_STATUSES)
    setFilteredSeverities([])
  }

  const handleStatusChange = (issue: AdvisorIssue, status: IssueStatus) => {
    updateMutation.mutate(
      { issueId: issue.id, status },
      { onSuccess: () => toast.success(`Issue ${status}`) }
    )
  }

  if (isLoading) return <GenericSkeletonLoader />

  return (
    <div className="flex flex-col gap-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col lg:flex-row lg:items-center gap-2">
          <Input
            placeholder="Search issues"
            size="tiny"
            icon={<Search />}
            value={filterString}
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
          />
          <FilterPopover
            name="Status"
            options={STATUS_FILTER_OPTIONS}
            labelKey="name"
            valueKey="value"
            activeOptions={filteredStatuses}
            labelClass="text-xs text-foreground-light"
            maxHeightClass="h-[240px]"
            className="w-44"
            onSaveFilters={setFilteredStatuses}
          />
          <FilterPopover
            name="Severity"
            options={SEVERITY_FILTER_OPTIONS}
            labelKey="name"
            valueKey="value"
            activeOptions={filteredSeverities}
            labelClass="text-xs text-foreground-light"
            maxHeightClass="h-[160px]"
            className="w-44"
            onSaveFilters={setFilteredSeverities}
          />
          {hasActiveFilters && (
            <Button
              type="default"
              size="tiny"
              className="px-1"
              icon={<X />}
              onClick={handleResetFilters}
            />
          )}
        </div>
        <p className="text-sm text-foreground-lighter whitespace-nowrap">
          {filteredIssues.length} issue{filteredIssues.length !== 1 ? 's' : ''}
          {activeCount > 0 && ` (${activeCount} open)`}
        </p>
      </div>

      {filteredIssues.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12">
          <CheckCircle2 className="h-8 w-8 mb-2 text-brand" />
          <p className="text-sm font-medium text-foreground">All clear!</p>
          <p className="text-sm text-foreground-lighter mt-1">
            No matching issues found.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Alerts</TableHead>
                <TableHead>Last Triggered</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredIssues.map((issue) => {
                const sev = severityConfig[issue.severity] ?? severityConfig.info
                const SeverityIcon = sev.icon
                const isActive = ['open', 'acknowledged', 'snoozed'].includes(issue.status)

                return (
                  <TableRow key={issue.id} className={!isActive ? 'opacity-60' : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <SeverityIcon className="h-4 w-4 shrink-0 text-foreground-lighter" />
                        <div className="min-w-0">
                          <Button
                            type="text"
                            className="text-sm p-0 hover:bg-transparent text-link-table-cell [&>span]:!w-full"
                            asChild
                          >
                            <Link href={`/project/${projectRef}/advisors/issues/${issue.id}`}>
                              {issue.title}
                            </Link>
                          </Button>
                          {issue.status === 'resolved' && (
                            <Badge variant="default" className="ml-2">Resolved</Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={sev.badgeVariant}>{issue.severity}</Badge>
                    </TableCell>
                    <TableCell className="capitalize text-foreground-lighter">
                      {issue.category}
                    </TableCell>
                    <TableCell className="text-foreground-lighter">
                      {issue.alert_count}
                    </TableCell>
                    <TableCell>
                      <TimestampInfo
                        className="text-sm"
                        utcTimestamp={issue.last_triggered_at}
                        labelFormat="D MMM, YYYY HH:mm"
                      />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="default" className="px-1" icon={<MoreVertical />} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="bottom" align="end" className="w-48">
                          {isActive && issue.status !== 'acknowledged' && (
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() => handleStatusChange(issue, 'acknowledged')}
                            >
                              <Eye size={12} />
                              <p>Acknowledge</p>
                            </DropdownMenuItem>
                          )}
                          {isActive && (
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() => handleStatusChange(issue, 'resolved')}
                            >
                              <CheckCircle2 size={12} />
                              <p>Resolve</p>
                            </DropdownMenuItem>
                          )}
                          {issue.status === 'resolved' && (
                            <DropdownMenuItem
                              className="space-x-2"
                              onClick={() => handleStatusChange(issue, 'open')}
                            >
                              <AlertTriangle size={12} />
                              <p>Reopen</p>
                            </DropdownMenuItem>
                          )}
                          {isActive && issue.status !== 'snoozed' && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => handleStatusChange(issue, 'snoozed')}
                              >
                                <Clock size={12} />
                                <p>Snooze</p>
                              </DropdownMenuItem>
                            </>
                          )}
                          {isActive && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="space-x-2"
                                onClick={() => handleStatusChange(issue, 'dismissed')}
                              >
                                <EyeOff size={12} />
                                <p>Dismiss</p>
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}
