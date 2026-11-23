import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, linkOptions, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { MoreVerticalIcon, PlusIcon, SearchIcon, WorkflowIcon, XIcon } from 'lucide-react'
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
  replicationClustersQueryOptions,
  useReplicationClusterGroups,
} from '@/data/replication/clusters-query'
import { replicationDestinationsQueryOptions } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { replicationPipelinesQueryOptions } from '@/data/replication/pipelines-query'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
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

export const Destinations = () => {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
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
  const {
    isLoading: isDiscoveringRegions,
    isSuccess: isRegionsSuccess,
    isError: isRegionsError,
    isFetching: isRetryingDiscovery,
    error: regionsError,
    refetch: refetchRegions,
  } = useQuery(replicationClustersQueryOptions())
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

  const clusterResults = groups.map((group, index) => {
    const destinationsResult = destinationResults[index]
    const pipelinesResult = pipelineResults[index]
    const sourcesResult = sourceResults[index]
    const destinations = destinationsResult.data?.destinations ?? []
    const pipelines = pipelinesResult.data?.pipelines ?? []
    const pipelinesByDestination = new Map(
      pipelines.map((pipeline) => [pipeline.destination_id, pipeline])
    )
    const visibleDestinations = pipelinesResult.isPending
      ? destinations
      : destinations.filter((destination) => pipelinesByDestination.has(destination.id))
    const listError = destinationsResult.error ?? pipelinesResult.error
    const sourceError = group.clusterId === undefined ? null : sourcesResult.error
    const error = listError ?? sourceError
    return {
      group,
      destinationsResult,
      pipelinesResult,
      sourcesResult,
      destinations,
      pipelines,
      pipelinesByDestination,
      visibleDestinations,
      error: checkLocalPipelinesNotSetUp(error) ? null : error,
      isPending: destinationsResult.isPending || pipelinesResult.isPending,
    }
  })

  const isDestinationsLoading =
    isDiscoveringRegions || clusterResults.some(({ isPending }) => isPending)
  const hasDestinations = clusterResults.some(
    ({ visibleDestinations }) => visibleDestinations.length > 0
  )
  const hasClusterErrors = clusterResults.some(({ error }) => error !== null)
  const shouldShowTable = hasDestinations || (hasMultipleRegions && hasClusterErrors)
  const tableColumnCount = 6

  const retryRegion = ({
    destinationsResult,
    pipelinesResult,
    sourcesResult,
  }: (typeof clusterResults)[number]) => {
    if (destinationsResult.isError) void destinationsResult.refetch()
    if (pipelinesResult.isError) void pipelinesResult.refetch()
    if (sourcesResult.isError) void sourcesResult.refetch()
  }
  const isRetryingRegion = ({
    destinationsResult,
    pipelinesResult,
    sourcesResult,
  }: (typeof clusterResults)[number]) =>
    destinationsResult.isFetching || pipelinesResult.isFetching || sourcesResult.isFetching

  const pipelineEntries = clusterResults.flatMap(({ group, pipelines }) =>
    pipelines.map((pipeline) => ({ pipeline, clusterId: group.clusterId }))
  )

  // These queries share the rows' query keys, so each status is fetched once per pipeline.
  const statusResults = useQueries({
    queries: pipelineEntries.map(({ pipeline, clusterId }) =>
      replicationPipelineStatusQueryOptions({ projectRef, pipelineId: pipeline.id, clusterId })
    ),
  })
  const statuses = new Map(
    pipelineEntries.map(({ pipeline }, index) => [
      pipeline,
      getStatusName(statusResults[index].data?.status),
    ])
  )

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

  const search = filterString.toLowerCase()
  const sortedDestinations = clusterResults
    .flatMap(({ group, visibleDestinations, pipelinesByDestination }) =>
      visibleDestinations
        .filter(({ name }) => name.toLowerCase().includes(search))
        .map((destination) => {
          const pipeline = pipelinesByDestination.get(destination.id)
          return { group, destination, status: pipeline && statuses.get(pipeline) }
        })
    )
    .sort((a, b) => {
      const comparison = a.destination.name.localeCompare(b.destination.name)
      const nameComparison = sortDirection === 'asc' ? comparison : -comparison
      if (sortColumn === 'name') return nameComparison
      return compareStatusNames(a.status, b.status, sortDirection) || nameComparison
    })

  const {
    data: defaultSources,
    isSuccess: isSourcesSuccess,
    isError: isSourcesError,
    error: sourcesError,
    refetch: refetchSources,
  } = sourceResults[0]
  const clustersWithProjectSource = groups
    .filter((_, index) =>
      sourceResults[index].data?.sources.some(({ name }) => name === projectRef)
    )
    .map(({ clusterId }) => clusterId)
  const hasExternalReplicationSource = clustersWithProjectSource.length > 0
  const replicationNotEnabled = isSourcesSuccess && !hasExternalReplicationSource

  const hasRegionalPipelines = clusterResults.some(
    ({ destinations, pipelines }) => destinations.length > 0 || pipelines.length > 0
  )
  const canConfirmDisable =
    (!IS_PLATFORM || isRegionsSuccess) &&
    !hasRegionalPipelines &&
    clusterResults.every(
      ({ destinationsResult, pipelinesResult, sourcesResult }) =>
        destinationsResult.isSuccess && pipelinesResult.isSuccess && sourcesResult.isSuccess
    )
  const canDisablePipelines = canConfirmDisable && hasExternalReplicationSource

  const isDefaultRegionEnabled = defaultSources?.sources.some(({ name }) => name === projectRef)
  const canCreate = isSourcesSuccess && !isCreationGateLoading
  const isCheckingPipelineStatus = isCreationGateLoading || (!isSourcesSuccess && !isSourcesError)
  const sourceErrorTitle = checkLocalPipelinesNotSetUp(sourcesError)
    ? 'Replication unavailable locally'
    : 'Failed to retrieve pipeline enablement status'

  const canLinkToWizard =
    isWizardEnabled && hasWizardDestination && !!projectRef && isDefaultRegionEnabled && canCreate
  const wizardLink = linkOptions({
    to: '/project/$ref/database/pipelines/new',
    params: { ref: projectRef ?? '_' },
  })

  const openCreation = (type: DestinationType) => {
    if (isWizardEnabled && hasWizardDestination && projectRef) {
      void navigate(wizardLink)
    } else {
      setDestinationType(type)
    }
  }

  const handleAddPipeline = () => {
    if (!canCreate) return
    if (!isDefaultRegionEnabled) {
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
      const prefetchKey = JSON.stringify([projectRef, group.clusterId])
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
                <Link
                  to="/org/$slug/usage"
                  params={{ slug: organization?.slug ?? '_' }}
                  hash="pipeline-initial-sync-data"
                >
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
                      <p className="text-foreground-lighter">
                        {hasRegionalPipelines
                          ? 'Delete all pipelines first'
                          : 'Check every region first'}
                      </p>
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
              {canLinkToWizard ? <Link {...wizardLink}>Add pipeline</Link> : 'Add pipeline'}
            </ButtonTooltip>
          </Shortcut>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {/* Mounted whether or not it has anything to say, so the update is announced */}
        <p role="status" aria-live="polite" className="sr-only">
          {isDestinationsLoading ? 'Loading pipelines' : ''}
        </p>

        {isRegionsError && (
          <AlertError
            error={regionsError}
            projectRef={projectRef}
            subject="Failed to retrieve pipeline regions"
            additionalActions={
              <Button loading={isRetryingDiscovery} onClick={() => void refetchRegions()}>
                Retry
              </Button>
            }
          />
        )}

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

        {!hasMultipleRegions && clusterResults[0].error && (
          <AlertError
            error={clusterResults[0].error}
            projectRef={projectRef}
            subject="Failed to retrieve pipelines"
            additionalActions={
              <Button
                loading={isRetryingRegion(clusterResults[0])}
                onClick={() => retryRegion(clusterResults[0])}
              >
                Retry
              </Button>
            }
          />
        )}

        {isDestinationsLoading && !shouldShowTable && (
          <GenericTableLoader headers={[null, 'Name', 'Status', 'Region', 'Lag', null]} />
        )}

        {shouldShowTable && (
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
                    <TableHead key="region">Region</TableHead>
                    <TableHead key="lag" className="w-[150px]">
                      Lag
                    </TableHead>
                    <TableHead key="actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedDestinations.map(({ group, destination }) => (
                    <ReplicationClusterProvider
                      key={`${group.clusterId ?? 'default'}:${destination.id}`}
                      clusterId={group.clusterId}
                    >
                      <DestinationRow
                        destinationId={destination.id}
                        pipelineRegion={group.region?.region_name}
                      />
                    </ReplicationClusterProvider>
                  ))}
                  {hasMultipleRegions &&
                    clusterResults.map((result) => {
                      const { group, error, isPending, sourcesResult } = result
                      const regionName = group.region?.region_name
                      if (!isPending && !error) return null

                      return (
                        <TableRow key={group.clusterId ?? 'default'}>
                          <TableCell colSpan={tableColumnCount}>
                            {error ? (
                              <AlertError
                                error={error}
                                projectRef={projectRef}
                                subject={
                                  error === sourcesResult.error
                                    ? `Failed to retrieve pipeline enablement status in ${regionName}`
                                    : `Failed to retrieve pipelines in ${regionName}`
                                }
                                additionalActions={
                                  <Button
                                    loading={isRetryingRegion(result)}
                                    onClick={() => retryRegion(result)}
                                  >
                                    Retry
                                  </Button>
                                }
                              />
                            ) : (
                              <>
                                <span className="sr-only">Loading pipelines in {regionName}</span>
                                <ShimmeringLoader />
                              </>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}

                  {!isDestinationsLoading &&
                    !hasClusterErrors &&
                    sortedDestinations.length === 0 &&
                    hasDestinations && (
                      <TableRowNoResults colSpan={tableColumnCount} search={filterString} />
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {!isDestinationsLoading && !hasDestinations && !hasClusterErrors && (
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
              {canLinkToWizard ? <Link {...wizardLink}>Add pipeline</Link> : 'Add pipeline'}
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
        canConfirm={canConfirmDisable}
        clusterIds={clustersWithProjectSource}
        open={showDisablePipelinesDialog}
        setOpen={setShowDisablePipelinesDialog}
      />
    </div>
  )
}
