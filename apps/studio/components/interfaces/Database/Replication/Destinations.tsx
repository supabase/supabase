import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { MoreVertical, Plus, Search, Workflow, X } from 'lucide-react'
import Link from 'next/link'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { EnablePipelinesModal } from './EnablePipelinesCallout'
import { getStatusName } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from './useIsETLPrivateAlpha'
import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'
import { AlertError } from '@/components/ui/AlertError'
import { Shortcut } from '@/components/ui/Shortcut'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import {
  replicationPipelineStatusQueryOptions,
  type ReplicationPipelineStatusData,
} from '@/data/replication/pipeline-status-query'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

type DestinationSortColumn = 'name' | 'status'
type DestinationSort = `${DestinationSortColumn}:${'asc' | 'desc'}`

// Worst first, so sorting ascending by status surfaces the pipelines that need attention.
const STATUS_SORT_ORDER: PipelineStatusName[] = [
  PipelineStatusName.FAILED,
  PipelineStatusName.STOPPED,
  PipelineStatusName.STOPPING,
  PipelineStatusName.STARTING,
  PipelineStatusName.STARTED,
  PipelineStatusName.UNKNOWN,
]

// Keyed by pipeline id from the responses themselves, so this never closes over component state.
const combinePipelineStatuses = (
  results: { data?: ReplicationPipelineStatusData }[]
): Map<number, PipelineStatusName | undefined> =>
  new Map(
    results
      .map((result) => result.data)
      .filter((data): data is ReplicationPipelineStatusData => data !== undefined)
      .map((data) => [data.pipeline_id, getStatusName(data.status)])
  )

const compareStatusNames = (a?: PipelineStatusName, b?: PipelineStatusName) => {
  const rankA = a === undefined ? STATUS_SORT_ORDER.length : STATUS_SORT_ORDER.indexOf(a)
  const rankB = b === undefined ? STATUS_SORT_ORDER.length : STATUS_SORT_ORDER.indexOf(b)
  return rankA - rankB
}

export const Destinations = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  useRedirectLegacyReadReplicaDestination()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()

  const newDestinationDefaultType: DestinationType | null = etlEnableBigQuery
    ? 'BigQuery'
    : etlEnableIceberg
      ? 'Analytics Bucket'
      : etlEnableDucklake
        ? 'DuckLake'
        : etlEnableSnowflake
          ? 'Snowflake'
          : etlEnableClickHouse
            ? 'ClickHouse'
            : null

  const prefetchedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState<string>('')
  const [showEnablePipelinesDialog, setShowEnablePipelinesDialog] = useState(false)
  const [showDisablePipelinesDialog, setShowDisablePipelinesDialog] = useState(false)

  const [, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
      'ClickHouse',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const {
    data: destinationsData,
    error: destinationsError,
    isPending: isDestinationsLoading,
    isError: isDestinationsError,
    isSuccess: isDestinationsSuccess,
  } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = useMemo(
    () => destinationsData?.destinations ?? [],
    [destinationsData?.destinations]
  )
  const hasDestinations = isDestinationsSuccess && destinationsData?.destinations.length > 0
  const filteredDestinations = useMemo(
    () =>
      filterString.length === 0
        ? destinations
        : destinations.filter((destination) =>
            destination.name.toLowerCase().includes(filterString.toLowerCase())
          ),
    [destinations, filterString]
  )

  const { data: pipelinesData, isSuccess: isPipelinesSuccess } = useReplicationPipelinesQuery({
    projectRef,
  })
  const pipelines = useMemo(() => pipelinesData?.pipelines ?? [], [pipelinesData?.pipelines])

  // Sorting by status needs every pipeline's status up here, not just inside each row. These share
  // the rows' query keys, so each status is still only fetched once.
  const statusByPipelineId = useQueries({
    queries: pipelines.map((pipeline) =>
      replicationPipelineStatusQueryOptions({ projectRef, pipelineId: pipeline.id })
    ),
    combine: combinePipelineStatuses,
  })

  const getDestinationStatus = (destinationId: number) => {
    const pipeline = pipelines.find((p) => p.destination_id === destinationId)
    return pipeline === undefined ? undefined : statusByPipelineId.get(pipeline.id)
  }

  const [sort, setSort] = useState<DestinationSort>('name:asc')
  const [sortColumn, sortDirection] = sort.split(':') as [DestinationSortColumn, 'asc' | 'desc']

  const getAriaSort = (column: DestinationSortColumn) => {
    if (sortColumn !== column) return 'none'
    return sortDirection === 'asc' ? 'ascending' : 'descending'
  }

  const handleSortChange = (column: DestinationSortColumn) => {
    if (sortColumn !== column) return setSort(`${column}:asc`)
    setSort(`${column}:${sortDirection === 'asc' ? 'desc' : 'asc'}`)
  }

  // Not memoized: the status map is rebuilt whenever a pipeline status refetches, so a useMemo
  // here would never hit. Sorting a handful of destinations per render costs nothing.
  const sortedDestinations = [...filteredDestinations].sort((a, b) => {
    const comparison =
      sortColumn === 'name'
        ? a.name.localeCompare(b.name)
        : compareStatusNames(getDestinationStatus(a.id), getDestinationStatus(b.id)) ||
          a.name.localeCompare(b.name)

    return sortDirection === 'asc' ? comparison : -comparison
  })

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery({
    projectRef,
  })
  const externalReplicationSource = useMemo(
    () => sourcesData?.sources.find((source) => source.name === projectRef),
    [projectRef, sourcesData?.sources]
  )
  const replicationNotEnabled = isSourcesSuccess && !externalReplicationSource

  const canDisablePipelines =
    isSourcesSuccess &&
    isDestinationsSuccess &&
    isPipelinesSuccess &&
    !!externalReplicationSource &&
    destinations.length === 0 &&
    pipelines.length === 0

  const isLoading = isDestinationsLoading
  const isLocalETLNotSetUp = checkLocalETLNotSetUp(destinationsError)
  const hasErrorsFetchingData = !isLocalETLNotSetUp && isDestinationsError

  const openDestinationPanel = () => {
    if (!newDestinationDefaultType) return
    setDestinationType(newDestinationDefaultType)
  }

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search pipelines' }
  )

  useShortcut(SHORTCUT_IDS.LIST_PAGE_RESET_FILTERS, () => setFilterString(''))

  useEffect(() => {
    if (
      projectRef &&
      !prefetchedRef.current &&
      pipelinesData?.pipelines &&
      pipelinesData.pipelines.length > 0 &&
      isPipelinesSuccess
    ) {
      prefetchedRef.current = true
      pipelinesData.pipelines.forEach((p) => {
        if (!p?.id) return
        queryClient.prefetchQuery({
          queryKey: replicationKeys.pipelinesVersion(projectRef, p.id),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion({ projectRef, pipelineId: p.id }, signal),
          staleTime: Infinity,
        })
      })
    }
  }, [projectRef, pipelinesData?.pipelines, isPipelinesSuccess, queryClient])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Input
            ref={searchInputRef}
            placeholder="Search pipelines"
            size="tiny"
            icon={<Search />}
            value={filterString}
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
            onKeyDown={onSearchInputEscape(filterString, setFilterString)}
            actions={
              filterString.length > 0 && (
                <Button
                  aria-label="Clear search"
                  variant="text"
                  icon={<X />}
                  className="p-0 h-5 w-5"
                  onClick={() => setFilterString('')}
                />
              )
            }
          />
        </div>
        <div className="flex items-center gap-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                aria-label="More actions"
                variant="default"
                icon={<MoreVertical />}
                className="px-1.25"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuItem asChild>
                <Link href={`/org/${organization?.slug}/usage#pipeline-initial-sync-data`}>
                  View Pipelines usage
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {replicationNotEnabled ? (
                <DropdownMenuItem onClick={() => setShowEnablePipelinesDialog(true)}>
                  Enable Pipelines
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem
                  className="data-disabled:pointer-events-auto data-disabled:cursor-not-allowed"
                  disabled={!canDisablePipelines}
                  onClick={() => {
                    if (!canDisablePipelines) return
                    setShowDisablePipelinesDialog(true)
                  }}
                >
                  <div className="flex flex-col gap-y-0.5">
                    <p>Disable Pipelines</p>
                    {!canDisablePipelines && (
                      <p className="text-foreground-lighter">Delete all pipelines first</p>
                    )}
                  </div>
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Shortcut
            id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
            label="Add pipeline"
            onTrigger={openDestinationPanel}
            options={{ enabled: !!newDestinationDefaultType }}
            side="bottom"
          >
            <Button
              variant="primary"
              icon={<Plus />}
              disabled={!newDestinationDefaultType}
              onClick={openDestinationPanel}
            >
              Add pipeline
            </Button>
          </Shortcut>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {hasErrorsFetchingData && (
          <AlertError error={destinationsError} subject="Failed to retrieve pipelines" />
        )}

        {isLoading ? (
          <GenericSkeletonLoader />
        ) : hasDestinations ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="type" className="w-[40px]" />
                    <TableHead key="name" className="w-[250px]" aria-sort={getAriaSort('name')}>
                      <TableHeadSort
                        column="name"
                        currentSort={sort}
                        onSortChange={handleSortChange}
                      >
                        Name
                      </TableHeadSort>
                    </TableHead>
                    <TableHead key="status" className="w-[150px]" aria-sort={getAriaSort('status')}>
                      <TableHeadSort
                        column="status"
                        currentSort={sort}
                        onSortChange={handleSortChange}
                      >
                        Status
                      </TableHeadSort>
                    </TableHead>
                    <TableHead key="lag" className="w-[150px]">
                      Lag
                    </TableHead>
                    <TableHead key="publication">Publication</TableHead>
                    <TableHead key="actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDestinations.map((destination) => (
                    <DestinationRow key={destination.id} destinationId={destination.id} />
                  ))}

                  {!isLoading && filteredDestinations.length === 0 && hasDestinations && (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <p>No results found</p>
                        <p className="text-foreground-light">
                          Your search for "{filterString}" did not return any results.
                        </p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          !isLoading &&
          !hasErrorsFetchingData && (
            <EmptyStatePresentational
              icon={Workflow}
              title="Add a pipeline"
              description="Send tables to an external destination for analytics workloads."
            >
              <Button
                variant="default"
                icon={<Plus />}
                disabled={!newDestinationDefaultType}
                onClick={openDestinationPanel}
              >
                Add pipeline
              </Button>
            </EmptyStatePresentational>
          )
        )}
      </div>

      <DestinationPanel />

      <EnablePipelinesModal
        open={showEnablePipelinesDialog}
        onOpenChange={setShowEnablePipelinesDialog}
      />

      <DisablePipelinesDialog
        open={showDisablePipelinesDialog}
        setOpen={setShowDisablePipelinesDialog}
      />
    </div>
  )
}
