import { keepPreviousData } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import dayjs from 'dayjs'
import { RefreshCwIcon } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, ResizablePanel, ResizablePanelGroup } from 'ui'
import { FilterBar, type FilterGroup, type FilterProperty } from 'ui-patterns/FilterBar'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { parseTimeRange, serializeTimeRange } from '../Settings/Logs/Logs.timeRange'
import { AuditLogDetailsPanel } from '@/components/interfaces/AuditLogs/AuditLogDetailsPanel'
import { getAuditLogColumns } from '@/components/interfaces/AuditLogs/AuditLogs.columns'
import {
  DATE_FILTER_PROPERTY,
  filterByFilterGroup,
  findDateCondition,
  getDefaultAuditLogRange,
  PROJECT_FILTER_PROPERTY,
} from '@/components/interfaces/AuditLogs/AuditLogs.utils'
import {
  DateRangeOption,
  formatDateRangeValue,
} from '@/components/interfaces/AuditLogs/AuditLogsDateRangeOption'
import { createAuditLogsProjectOption } from '@/components/interfaces/AuditLogs/AuditLogsProjectOption'
import { AuditLogsSelectionHeader } from '@/components/interfaces/AuditLogs/AuditLogsSelectionHeader'
import { AuditLogsTable } from '@/components/interfaces/AuditLogs/AuditLogsTable'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { type AuditLog } from '@/data/organizations/organization-audit-logs-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProfileAuditLogsQuery } from '@/data/profile/profile-audit-logs-query'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'

const CONTENT_PADDING = 'w-full px-6 xl:px-10'

export const AuditLogs = () => {
  const [dateRange, setDateRange] = useState(getDefaultAuditLogRange)

  const [selectedLog, setSelectedLog] = useState<AuditLog>()
  const [filterGroup, setFilterGroup] = useState<FilterGroup>(() => ({
    logicalOperator: 'AND',
    conditions: [
      {
        propertyName: DATE_FILTER_PROPERTY,
        operator: '=',
        value: serializeTimeRange([new Date(dateRange.from), new Date(dateRange.to)]),
      },
    ],
  }))
  const [freeformText, setFreeformText] = useState('')
  const [projectNames, setProjectNames] = useState<Record<string, string>>({})

  const handleSelectProject = (project: { ref: string; name: string }) =>
    setProjectNames((prev) => ({ ...prev, [project.ref]: project.name }))

  const handleFilterChange = (next: FilterGroup) => {
    setFilterGroup(next)
    // The API call is driven by `dateRange`, so keep it in sync with the date chip
    const dateCondition = findDateCondition(next)
    if (!dateCondition) {
      setDateRange(getDefaultAuditLogRange())
      return
    }
    const range = parseTimeRange(dateCondition.value)
    if (range) setDateRange({ from: range[0].toISOString(), to: range[1].toISOString() })
  }

  const { data: projectsData, isPending: isLoadingProjects } = useProjectsInfiniteQuery(
    {},
    { placeholderData: keepPreviousData }
  )
  const projects = useMemo(
    () => projectsData?.pages.flatMap((page) => page.projects) ?? [],
    [projectsData?.pages]
  )

  const { data: organizations, isPending: isLoadingOrganizations } = useOrganizationsQuery()
  const {
    data,
    error,
    isPending: isLoading,
    isSuccess,
    isError,
    isRefetching,
    refetch,
  } = useProfileAuditLogsQuery(
    {
      iso_timestamp_start: dateRange.from,
      iso_timestamp_end: dateRange.to,
    },
    {
      retry: false,
      placeholderData: keepPreviousData,
    }
  )

  const logs = useMemo(() => data?.result ?? [], [data?.result])
  const filteredLogs = useMemo(() => filterByFilterGroup(logs, filterGroup), [logs, filterGroup])

  const hasDateFilter = !!findDateCondition(filterGroup)
  const filterProperties: FilterProperty[] = [
    {
      label: 'Project',
      name: PROJECT_FILTER_PROPERTY,
      type: 'string',
      operators: ['='],
      options: { component: createAuditLogsProjectOption(handleSelectProject) },
      formatValue: (value) => {
        const ref = String(value ?? '')
        return projectNames[ref] ?? projects.find((p) => p.ref === ref)?.name ?? ref
      },
    },
    {
      label: 'Date range',
      name: DATE_FILTER_PROPERTY,
      type: 'date',
      operators: [{ label: 'Equals', value: '=', group: 'comparison' }],
      options: { component: DateRangeOption },
      formatValue: formatDateRangeValue,
      isAvailable: !hasDateFilter,
      topLevelOnly: true,
    },
  ]

  const lastSelectedRowId = useRef<string | null>(null)
  const columns = useMemo(
    () =>
      getAuditLogColumns({
        projects,
        organizations: organizations ?? [],
        lastSelectedRowId,
        isLoadingProjects,
        isLoadingOrganizations,
      }),
    [projects, organizations, isLoadingProjects, isLoadingOrganizations]
  )
  const [sorting, setSorting] = useState<SortingState>([{ id: 'date', desc: true }])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  const table = useReactTable({
    data: filteredLogs,
    columns,
    state: { sorting, rowSelection },
    enableMultiRowSelection: true,
    getRowId: (row) => row.request_id,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  // This feature depends on the subscription tier of the user. Free user can view logs up to 1 day
  // in the past. The API limits the logs to maximum of 1 day and 5 minutes so when the page is
  // viewed for more than 5 minutes, the call parameters needs to be updated. This also works with
  // higher tiers (7 days of logs).The user will see a loading shimmer.
  useEffect(() => {
    const duration = dayjs(dateRange.from).diff(dayjs(dateRange.to))
    const interval = setInterval(() => {
      const currentTime = dayjs().utc().set('millisecond', 0)
      setDateRange({
        from: currentTime.add(duration).toISOString(),
        to: currentTime.toISOString(),
      })
    }, 5 * 60000)

    return () => clearInterval(interval)
  }, [dateRange.from, dateRange.to])

  return (
    <ScaffoldContainer size="full" className="px-0 h-full flex flex-col">
      <ScaffoldSection isFullWidth className="pt-6! pb-0! flex-1 min-h-0">
        <div className="flex flex-col h-full min-h-0">
          {isLoading && (
            <div className={cn(CONTENT_PADDING, 'space-y-2')}>
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          )}

          {isError && (
            <div className={CONTENT_PADDING}>
              <AlertError error={error} subject="Failed to retrieve audit logs" />
            </div>
          )}

          {isSuccess && (
            <>
              <div className="border-t py-2 pl-1 pr-4 flex flex-col md:flex-row md:items-center justify-between">
                <FilterBar
                  supportsOperators
                  variant="pill"
                  defaultGroupOperator="OR"
                  className="bg-transparent border-0 [&>div>div>div>input]:!text-xs [&_[data-testid=filter-bar-freeform-input]]:min-w-64"
                  filterProperties={filterProperties}
                  freeformText={freeformText}
                  filters={filterGroup}
                  onFilterChange={handleFilterChange}
                  onFreeformTextChange={setFreeformText}
                />
                <ButtonTooltip
                  disabled={isLoading}
                  loading={isLoading || isRefetching}
                  className="w-7"
                  icon={<RefreshCwIcon />}
                  onClick={() => refetch()}
                  tooltip={{ content: { side: 'bottom', text: 'Refresh logs' } }}
                />
              </div>

              {logs.length === 0 ? (
                <div className={CONTENT_PADDING}>
                  <div className="bg-surface-100 border rounded-sm p-4 flex items-center justify-between">
                    <p className="prose text-sm">You do not have any audit logs available yet</p>
                  </div>
                </div>
              ) : logs.length > 0 && filteredLogs.length === 0 ? (
                <div className={CONTENT_PADDING}>
                  <div className="bg-surface-100 border rounded-sm p-4 flex items-center justify-between">
                    <p className="prose text-sm">
                      No audit logs found based on the filters applied
                    </p>
                  </div>
                </div>
              ) : (
                <div className="border-y overflow-hidden flex-1 min-h-0">
                  <ResizablePanelGroup orientation="horizontal" className="h-full">
                    <ResizablePanel
                      defaultSize={100}
                      minSize={30}
                      className="flex flex-col overflow-hidden"
                    >
                      <div className="grow relative overflow-hidden">
                        <AuditLogsSelectionHeader table={table} />
                        <AuditLogsTable
                          table={table}
                          selectedLog={selectedLog}
                          onSelectLog={(log) =>
                            setSelectedLog((prev) =>
                              prev?.request_id === log.request_id ? undefined : log
                            )
                          }
                        />
                      </div>
                    </ResizablePanel>
                    {selectedLog && (
                      <AuditLogDetailsPanel
                        selectedLog={selectedLog}
                        onClose={() => setSelectedLog(undefined)}
                      />
                    )}
                  </ResizablePanelGroup>
                </div>
              )}
            </>
          )}
        </div>
      </ScaffoldSection>
    </ScaffoldContainer>
  )
}
