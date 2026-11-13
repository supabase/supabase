import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useRouter as useTanStackRouter } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { MoreVerticalIcon, PlusIcon, SearchIcon, WorkflowIcon, XIcon } from 'lucide-react'
import { useRouter as useNextRouter } from 'next/compat/router'
import Link from 'next/link'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useRef, useState } from 'react'
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
import { GenericTableLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { EnablePipelinesModal } from './EnablePipelinesCallout'
import { getStatusName } from './Pipeline.utils'
import { useUrlReplicationClusterId } from './PipelineClusterScope'
import { PipelineStatusName } from './Replication.constants'
import {
  useIsPipelinesBigQueryEnabled,
  useIsPipelinesClickHouseEnabled,
  useIsPipelinesDuckLakeEnabled,
  useIsPipelinesSnowflakeEnabled,
} from './useIsPipelinesEnabled'
import { useRedirectLegacyReadReplicaDestination } from './useRedirectLegacyReadReplicaDestination'
import { usePipelineCreationPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import { TableRowNoResults } from '@/components/ui/TableRowNoResults'
import {
  getReplicationRegionLabel,
  useReplicationClusterGroups,
  type ReplicationRegion,
} from '@/data/replication/clusters-query'
import {
  replicationDestinationsQueryOptions,
  type ReplicationDestinationsData,
} from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import {
  replicationPipelineStatusQueryOptions,
  type ReplicationPipelineStatusData,
} from '@/data/replication/pipeline-status-query'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { replicationPipelinesQueryOptions, type Pipeline } from '@/data/replication/pipelines-query'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
import type { StudioError } from '@/lib/errors/studio-errors'
import { onSearchInputEscape } from '@/lib/keyboard'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
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
): Map<string, PipelineStatusName | undefined> =>
  new Map(
    results
      .map((result) => result.data)
      .filter((data): data is ReplicationPipelineStatusData => data !== undefined)
      .map((data) => [data.pipeline_id, getStatusName(data.status)])
  )

const compareStatusNames = (
  a: PipelineStatusName | undefined,
  b: PipelineStatusName | undefined,
  direction: 'asc' | 'desc'
) => {
  if (a === undefined) return b === undefined ? 0 : 1
  if (b === undefined) return -1

  const comparison = STATUS_SORT_ORDER.indexOf(a) - STATUS_SORT_ORDER.indexOf(b)
  return direction === 'asc' ? comparison : -comparison
}

const RegionRows = ({
  region,
  error,
  isLoading,
  hasRows,
}: {
  region?: ReplicationRegion
  error: StudioError | null
  isLoading: boolean
  hasRows: boolean
}) => {
  if (!error && !isLoading && !hasRows) return null

  return (
    <>
      <TableRow className="bg-surface-75 hover:bg-surface-75">
        <TableCell colSpan={6} className="py-2 text-xs text-foreground-light">
          <span className="font-medium text-foreground">{region?.region_name}</span>
          {region?.region_code && (
            <span className="ml-2 font-mono text-foreground-lighter">{region.region_code}</span>
          )}
        </TableCell>
      </TableRow>
      {isLoading && (
        <TableRow>
          <TableCell colSpan={6}>
            <ShimmeringLoader />
          </TableCell>
        </TableRow>
      )}
      {error && (
        <TableRow>
          <TableCell colSpan={6}>
            <AlertError
              error={error}
              subject={`Failed to retrieve pipelines in ${getReplicationRegionLabel(region)}`}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  )
}

export const Destinations = () => {
  const queryClient = useQueryClient()
  const router = useTanStackRouter({ warn: false })
  const nextRouter = useNextRouter()
  const { isEnabled: isWizardEnabled, isLoading: isPreviewLoading } = usePipelineCreationPreview()
  const bigQuery = useIsPipelinesBigQueryEnabled()
  const duckLake = useIsPipelinesDuckLakeEnabled()
  const snowflake = useIsPipelinesSnowflakeEnabled()
  const clickHouse = useIsPipelinesClickHouseEnabled()
  const hasWizardDestination = bigQuery || duckLake || snowflake || clickHouse
  const { hasLoaded: hasFlagsLoaded } = useFeatureFlags()
  const isCreationGateLoading = isPreviewLoading || (IS_PLATFORM && !hasFlagsLoaded)
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  useRedirectLegacyReadReplicaDestination()

  const prefetchedClustersRef = useRef(new Set<string>())
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState<string>('')
  const [showEnablePipelinesDialog, setShowEnablePipelinesDialog] = useState(false)
  const pendingCreationTypeRef = useRef<DestinationType | null>(null)
  const [showDisablePipelinesDialog, setShowDisablePipelinesDialog] = useState(false)

  const [edit] = useQueryState('edit', parseAsInteger)
  const editClusterId = useUrlReplicationClusterId()
  const [, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'BigQuery',
      'DuckLake',
      'Snowflake',
      'ClickHouse',
    ]).withOptions({
      history: 'push',
      clearOnDefault: true,
    })
  )

  const { groups, hasMultipleRegions } = useReplicationClusterGroups()
  const destinationResults = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationDestinationsQueryOptions({ projectRef, clusterId })
    ),
  })
  const pipelineResults = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationPipelinesQueryOptions({ projectRef, clusterId })
    ),
  })
  const sourceResults = useQueries({
    queries: groups.map(({ clusterId }) =>
      replicationSourcesQueryOptions({ projectRef, clusterId })
    ),
  })

  const filterDestinations = <T extends { name: string }>(destinations: T[]) =>
    filterString.length === 0
      ? destinations
      : destinations.filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  const clusterResults = groups.map((group, index) => {
    const destinationsResult = destinationResults[index]
    const pipelinesResult = pipelineResults[index]
    const destinations = destinationsResult.data?.destinations ?? []
    return {
      group,
      destinationsResult,
      pipelinesResult,
      destinations,
      filteredDestinations: filterDestinations(destinations),
      pipelines: pipelinesResult.data?.pipelines ?? [],
      hasError:
        destinationsResult.isError && !checkLocalPipelinesNotSetUp(destinationsResult.error),
    }
  })

  const { error: destinationsError, isError: isDestinationsError } = destinationResults[0]
  const isDestinationsLoading = destinationResults.every((result) => result.isPending)
  const hasDestinations = clusterResults.some(({ destinations }) => destinations.length > 0)
  const hasFilteredDestinations = clusterResults.some(
    ({ filteredDestinations }) => filteredDestinations.length > 0
  )
  const hasClusterErrors = clusterResults.some(({ hasError }) => hasError)

  // Sorting by status needs every pipeline's status up here, not just inside each row. These share
  // the rows' query keys, so each status is still only fetched once.
  const statusByPipelineId = useQueries({
    queries: clusterResults.flatMap(({ group, pipelines }) =>
      pipelines.map((pipeline) =>
        replicationPipelineStatusQueryOptions({
          projectRef,
          pipelineId: pipeline.id,
          clusterId: group.clusterId,
        })
      )
    ),
    combine: combinePipelineStatuses,
  })

  const getDestinationStatus = (pipelines: Pipeline[], destinationId: number) => {
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
  const sortDestinations = (
    destinations: ReplicationDestinationsData['destinations'],
    pipelines: Pipeline[]
  ) =>
    [...destinations].sort((a, b) => {
      if (sortColumn === 'status') {
        const nameComparison = a.name.localeCompare(b.name)

        return (
          compareStatusNames(
            getDestinationStatus(pipelines, a.id),
            getDestinationStatus(pipelines, b.id),
            sortDirection
          ) || (sortDirection === 'asc' ? nameComparison : -nameComparison)
        )
      }

      const comparison = a.name.localeCompare(b.name)
      return sortDirection === 'asc' ? comparison : -comparison
    })

  const {
    isSuccess: isSourcesSuccess,
    isError: isSourcesError,
    error: sourcesError,
    refetch: refetchSources,
  } = sourceResults[0]
  const hasExternalReplicationSource = sourceResults.some(
    ({ data }) => data?.sources.some((source) => source.name === projectRef) === true
  )
  const replicationNotEnabled = isSourcesSuccess && !hasExternalReplicationSource

  const canDisablePipelines =
    isSourcesSuccess &&
    hasExternalReplicationSource &&
    clusterResults.every(
      ({ destinationsResult, pipelinesResult, destinations, pipelines }) =>
        destinationsResult.isSuccess &&
        pipelinesResult.isSuccess &&
        destinations.length === 0 &&
        pipelines.length === 0
    )

  const isLocalPipelinesNotSetUp = checkLocalPipelinesNotSetUp(destinationsError)
  const hasErrorsFetchingData = hasMultipleRegions
    ? hasClusterErrors
    : !isLocalPipelinesNotSetUp && isDestinationsError

  const canCreate = isSourcesSuccess && !isCreationGateLoading
  const isCheckingPipelineStatus = isCreationGateLoading || (!isSourcesSuccess && !isSourcesError)
  const sourceErrorTitle = checkLocalPipelinesNotSetUp(sourcesError)
    ? 'Replication unavailable locally'
    : 'Failed to retrieve pipeline enablement status'

  const canLinkToWizard =
    isWizardEnabled && hasWizardDestination && !!projectRef && !replicationNotEnabled && canCreate
  const wizardHref = `/project/${projectRef}/database/pipelines/new`

  const openCreation = (type: DestinationType) => {
    if (isWizardEnabled && hasWizardDestination && projectRef) {
      if (router)
        void router.navigate({
          to: '/project/$ref/database/pipelines/new',
          params: { ref: projectRef },
        })
      else void nextRouter?.push(wizardHref)
    } else {
      setDestinationType(type)
    }
  }

  const handleAddPipeline = () => {
    if (!canCreate) return
    if (replicationNotEnabled) {
      pendingCreationTypeRef.current = 'BigQuery'
      setShowEnablePipelinesDialog(true)
      return
    }
    openCreation('BigQuery')
  }

  const handleEnableDialogOpenChange = (open: boolean) => {
    setShowEnablePipelinesDialog(open)
    if (!open) pendingCreationTypeRef.current = null
  }

  const handlePipelinesEnabled = () => {
    const type = pendingCreationTypeRef.current
    pendingCreationTypeRef.current = null
    if (
      type &&
      queryClient.getQueryState(replicationKeys.sources(projectRef))?.status === 'success'
    ) {
      openCreation(type)
    }
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
    if (!projectRef) return
    clusterResults.forEach(({ group, pipelinesResult, pipelines }) => {
      const prefetchKey = group.clusterId ?? 'default'
      if (!pipelinesResult.isSuccess || prefetchedClustersRef.current.has(prefetchKey)) return
      if (pipelines.length === 0) return
      prefetchedClustersRef.current.add(prefetchKey)
      pipelines.forEach((p) => {
        if (!p?.id) return
        queryClient.prefetchQuery({
          queryKey: replicationKeys.pipelinesVersion(projectRef, p.id, group.clusterId),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion(
              { projectRef, pipelineId: p.id, clusterId: group.clusterId },
              signal
            ),
          staleTime: Infinity,
        })
      })
    })
  }, [projectRef, clusterResults, queryClient])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Input
            ref={searchInputRef}
            placeholder="Search pipelines"
            size="tiny"
            icon={<SearchIcon />}
            value={filterString}
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
            onKeyDown={onSearchInputEscape(filterString, setFilterString)}
            actions={
              filterString.length > 0 && (
                <Button
                  aria-label="Clear search"
                  variant="text"
                  icon={<XIcon />}
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
                icon={<MoreVerticalIcon />}
                className="w-6.5 hit-area-1"
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
                <DropdownMenuItem
                  onClick={() => {
                    pendingCreationTypeRef.current = null
                    setShowEnablePipelinesDialog(true)
                  }}
                >
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
            onTrigger={handleAddPipeline}
            options={{ enabled: canCreate }}
            side="bottom"
            tooltipOpen={canCreate ? undefined : false}
          >
            <ButtonTooltip
              tooltip={{
                content: { text: isSourcesError && !canCreate ? sourceErrorTitle : undefined },
              }}
              variant="primary"
              icon={<PlusIcon />}
              loading={isCheckingPipelineStatus}
              disabled={!canCreate}
              asChild={canLinkToWizard}
              onClick={canLinkToWizard ? undefined : handleAddPipeline}
            >
              {canLinkToWizard ? <Link href={wizardHref}>Add pipeline</Link> : 'Add pipeline'}
            </ButtonTooltip>
          </Shortcut>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {/* Mounted whether or not it has anything to say, so the update is announced */}
        <p role="status" aria-live="polite" className="sr-only">
          {isDestinationsLoading ? 'Loading pipelines' : ''}
        </p>

        {isSourcesError && (
          <AlertError
            layout="responsive"
            projectRef={projectRef}
            error={sourcesError}
            subject={sourceErrorTitle}
            hideContactSupport={checkLocalPipelinesNotSetUp(sourcesError)}
            description={
              checkLocalPipelinesNotSetUp(sourcesError)
                ? 'Configure the replication API to manage pipelines in local development.'
                : undefined
            }
            additionalActions={<Button onClick={() => refetchSources()}>Retry</Button>}
          />
        )}

        {hasErrorsFetchingData && !hasMultipleRegions && (
          <AlertError error={destinationsError} subject="Failed to retrieve pipelines" />
        )}

        {isDestinationsLoading && (
          <GenericTableLoader headers={[null, 'Name', 'Status', 'Lag', 'Publication', null]} />
        )}

        {!isDestinationsLoading &&
          (hasDestinations || (hasMultipleRegions && hasClusterErrors)) && (
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
                      <TableHead
                        key="status"
                        className="w-[150px]"
                        aria-sort={getAriaSort('status')}
                      >
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
                    {clusterResults.map((result) => (
                      <ReplicationClusterProvider
                        key={result.group.clusterId ?? 'default'}
                        clusterId={result.group.clusterId}
                      >
                        {hasMultipleRegions && (
                          <RegionRows
                            region={result.group.region}
                            error={result.hasError ? result.destinationsResult.error : null}
                            isLoading={result.destinationsResult.isPending}
                            hasRows={result.filteredDestinations.length > 0}
                          />
                        )}
                        {sortDestinations(result.filteredDestinations, result.pipelines).map(
                          (destination) => (
                            <DestinationRow key={destination.id} destinationId={destination.id} />
                          )
                        )}
                      </ReplicationClusterProvider>
                    ))}

                    {!isDestinationsLoading && !hasFilteredDestinations && hasDestinations && (
                      <TableRowNoResults colSpan={6} search={filterString} />
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

        {!isDestinationsLoading && !hasDestinations && !hasErrorsFetchingData && (
          <EmptyStatePresentational
            icon={WorkflowIcon}
            title="Add a pipeline"
            description="Send tables to an external destination for analytics workloads."
          >
            <ButtonTooltip
              tooltip={{
                content: { text: isSourcesError && !canCreate ? sourceErrorTitle : undefined },
              }}
              variant="default"
              icon={<PlusIcon />}
              loading={isCheckingPipelineStatus}
              disabled={!canCreate}
              asChild={canLinkToWizard}
              onClick={canLinkToWizard ? undefined : handleAddPipeline}
            >
              {canLinkToWizard ? <Link href={wizardHref}>Add pipeline</Link> : 'Add pipeline'}
            </ButtonTooltip>
          </EmptyStatePresentational>
        )}
      </div>

      <ReplicationClusterProvider clusterId={edit === null ? undefined : editClusterId}>
        <DestinationPanel />
      </ReplicationClusterProvider>

      <EnablePipelinesModal
        open={showEnablePipelinesDialog}
        onOpenChange={handleEnableDialogOpenChange}
        onSuccess={handlePipelinesEnabled}
      />

      <DisablePipelinesDialog
        open={showDisablePipelinesDialog}
        setOpen={setShowDisablePipelinesDialog}
      />
    </div>
  )
}
