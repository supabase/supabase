import { keepPreviousData } from '@tanstack/react-query'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table'
import { useDebounce } from '@uidotdev/usehooks'
import dayjs from 'dayjs'
import { RefreshCw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { cn, ResizablePanel, ResizablePanelGroup } from 'ui'
import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { LogsDatePicker } from '../../Settings/Logs/Logs.DatePickers'
import { AuditLogDetailsPanel } from './AuditLogDetailsPanel'
import { getAuditLogColumns } from './AuditLogs.columns'
import { filterByProjects } from './AuditLogs.utils'
import { AuditLogsSelectionHeader } from './AuditLogsSelectionHeader'
import { AuditLogsTable } from './AuditLogsTable'
import { ScaffoldContainer, ScaffoldSection } from '@/components/layouts/Scaffold'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FilterPopover } from '@/components/ui/FilterPopover'
import { type AuditLog } from '@/data/organizations/organization-audit-logs-query'
import { useOrganizationsQuery } from '@/data/organizations/organizations-query'
import { useProfileAuditLogsQuery } from '@/data/profile/profile-audit-logs-query'
import { useProjectsInfiniteQuery } from '@/data/projects/projects-infinite-query'

const CONTENT_PADDING = 'w-full px-6 xl:px-10'

export const AuditLogs = () => {
  const currentTime = dayjs().utc().set('millisecond', 0)

  const [search, setSearch] = useState('')
  const debouncedSearch = useDebounce(search, 500)

  const [dateRange, setDateRange] = useState({
    from: currentTime.subtract(1, 'day').toISOString(),
    to: currentTime.toISOString(),
  })

  const [selectedLog, setSelectedLog] = useState<AuditLog>()
  const [filters, setFilters] = useState<{ projects: string[] }>({
    projects: [],
  })

  const {
    data: projectsData,
    isPending: isLoadingProjects,
    isFetching: isFetchingProjects,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProjectsInfiniteQuery(
    { search: search.length === 0 ? search : debouncedSearch },
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

  const logs = data?.result ?? []
  const filteredLogs = filterByProjects(logs, filters.projects)

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
        <div className="space-y-4 flex flex-col h-full min-h-0">
          {/* [Joshen] Can consider replacing this with filter bar */}
          <div
            className={cn(
              CONTENT_PADDING,
              'flex flex-col md:flex-row md:items-center justify-between'
            )}
          >
            <div className="flex items-center space-x-2">
              <p className="text-xs prose">Filter by</p>
              <FilterPopover
                name="Projects"
                options={projects}
                labelKey="name"
                valueKey="ref"
                activeOptions={filters.projects}
                onSaveFilters={(values) => setFilters({ ...filters, projects: values })}
                search={search}
                setSearch={setSearch}
                hasNextPage={hasNextPage}
                isLoading={isLoadingProjects}
                isFetching={isFetchingProjects}
                isFetchingNextPage={isFetchingNextPage}
                fetchNextPage={fetchNextPage}
              />
              <LogsDatePicker
                hideWarnings
                value={dateRange}
                onSubmit={(value) => setDateRange(value)}
                helpers={[
                  {
                    text: 'Last 1 hour',
                    calcFrom: () => dayjs().subtract(1, 'hour').toISOString(),
                    calcTo: () => dayjs().toISOString(),
                  },
                  {
                    text: 'Last 3 hours',
                    calcFrom: () => dayjs().subtract(3, 'hour').toISOString(),
                    calcTo: () => dayjs().toISOString(),
                  },

                  {
                    text: 'Last 6 hours',
                    calcFrom: () => dayjs().subtract(6, 'hour').toISOString(),
                    calcTo: () => dayjs().toISOString(),
                  },
                  {
                    text: 'Last 12 hours',
                    calcFrom: () => dayjs().subtract(12, 'hour').toISOString(),
                    calcTo: () => dayjs().toISOString(),
                  },
                  {
                    text: 'Last 24 hours',
                    calcFrom: () => dayjs().subtract(1, 'day').toISOString(),
                    calcTo: () => dayjs().toISOString(),
                  },
                ]}
              />
            </div>
            <ButtonTooltip
              disabled={isLoading}
              loading={isLoading || isRefetching}
              className="w-7"
              icon={<RefreshCw />}
              onClick={() => refetch()}
              tooltip={{ content: { side: 'bottom', text: 'Refresh logs' } }}
            />
          </div>

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
              {logs.length === 0 ? (
                <div
                  className={cn(
                    CONTENT_PADDING,
                    'bg-surface-100 border rounded-sm p-4 flex items-center justify-between'
                  )}
                >
                  <p className="prose text-sm">You do not have any audit logs available yet</p>
                </div>
              ) : logs.length > 0 && filteredLogs.length === 0 ? (
                <div
                  className={cn(
                    CONTENT_PADDING,
                    'bg-surface-100 border rounded-sm p-4 flex items-center justify-between'
                  )}
                >
                  <p className="prose text-sm">No audit logs found based on the filters applied</p>
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
