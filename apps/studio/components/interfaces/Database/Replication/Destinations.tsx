import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, linkOptions, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { MoreVerticalIcon, PlusIcon, SearchIcon, WorkflowIcon, XIcon } from 'lucide-react'
import { parseAsInteger, parseAsStringEnum, useQueryState } from 'nuqs'
import { useRef, useState } from 'react'
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
import { Admonition } from 'ui-patterns/Admonition'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericTableLoader, ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'

import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { EnablePipelinesModal } from './EnablePipelinesCallout'
import { useUrlReplicationClusterId } from './PipelineClusterScope'
import {
  useIsPipelinesBigQueryEnabled,
  useIsPipelinesClickHouseEnabled,
  useIsPipelinesDuckLakeEnabled,
  useIsPipelinesSnowflakeEnabled,
} from './useIsPipelinesEnabled'
import { usePipelineList } from './usePipelineList'
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
import { replicationKeys } from '@/data/replication/keys'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
import { onSearchInputEscape } from '@/lib/keyboard'
import { ReplicationClusterProvider } from '@/state/replication-cluster'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

type DestinationSortColumn = 'name' | 'status'
type DestinationSort = `${DestinationSortColumn}:${'asc' | 'desc'}`

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

  const { clusterResults, sortedDestinations } = usePipelineList({
    projectRef,
    groups,
    filterString,
    sortColumn,
    sortDirection,
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

  const failedRegions = clusterResults.filter(({ error }) => error !== null)
  const pendingRegions = clusterResults.filter(({ isPending, error }) => isPending && !error)
  const failedRegionTitle =
    failedRegions.length === 1
      ? `Pipelines could not be loaded from ${failedRegions[0].group.region?.region_name ?? 'one region'}`
      : `Pipelines could not be loaded from ${failedRegions.length} regions`

  const {
    data: defaultSources,
    isSuccess: isSourcesSuccess,
    isError: isSourcesError,
    error: sourcesError,
    refetch: refetchSources,
  } = clusterResults[0].sourcesResult
  const clustersWithProjectSource = clusterResults
    .filter(({ sourcesResult }) =>
      sourcesResult.data?.sources.some(({ name }) => name === projectRef)
    )
    .map(({ group }) => group.clusterId)
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

        {hasClusterErrors && (
          <Admonition
            type="warning"
            layout="responsive"
            title={failedRegionTitle}
            description="Affected regions:"
            actions={
              <Button
                loading={failedRegions.some(isRetryingRegion)}
                onClick={() => failedRegions.forEach(retryRegion)}
              >
                Retry
              </Button>
            }
          >
            <details>
              <summary className="cursor-pointer text-foreground-light">
                View affected regions
              </summary>
              <ul className="list-disc pl-5 space-y-1">
                {failedRegions.map(({ group, error }) => (
                  <li key={group.clusterId ?? 'default'}>
                    <span>{group.region?.region_name ?? 'Default region'}</span>:{' '}
                    <span>{error?.message}</span>
                  </li>
                ))}
              </ul>
          </Admonition>
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
                  {pendingRegions.length > 0 && (
                    <TableRow>
                      <TableCell colSpan={tableColumnCount}>
                        <span className="sr-only">Loading pipelines from remaining regions</span>
                        <ShimmeringLoader />
                      </TableCell>
                    </TableRow>
                  )}

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
