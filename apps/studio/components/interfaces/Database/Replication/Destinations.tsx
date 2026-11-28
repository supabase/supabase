import { useQueryClient } from '@tanstack/react-query'
import { Link, linkOptions, useNavigate } from '@tanstack/react-router'
import { useFeatureFlags, useParams } from 'common'
import { MoreVerticalIcon, PlusIcon, SearchIcon, WorkflowIcon, XIcon } from 'lucide-react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
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
  TableHead,
  TableHeader,
  TableHeadSort,
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericTableLoader } from 'ui-patterns/ShimmeringLoader'

import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { EnablePipelinesModal } from './EnablePipelinesCallout'
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
import { replicationKeys } from '@/data/replication/keys'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { IS_PLATFORM } from '@/lib/constants'
import { onSearchInputEscape } from '@/lib/keyboard'
import { useReplicationClusterId } from '@/state/replication-cluster'
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
  const clusterId = useReplicationClusterId()
  const { data: organization } = useSelectedOrganizationQuery()

  useRedirectLegacyReadReplicaDestination()

  const prefetchedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState<string>('')
  const [showEnablePipelinesDialog, setShowEnablePipelinesDialog] = useState(false)
  const pendingCreationTypeRef = useRef<DestinationType | null>(null)
  const [showDisablePipelinesDialog, setShowDisablePipelinesDialog] = useState(false)

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
    groups: [{ clusterId }],
    filterString,
    sortColumn,
    sortDirection,
  })
  const { destinationsResult, pipelinesResult, sourcesResult, destinations, pipelines } =
    clusterResults[0]
  const {
    error: destinationsError,
    isPending: isDestinationsLoading,
    isError: isDestinationsError,
    isSuccess: isDestinationsSuccess,
  } = destinationsResult
  const hasDestinations = isDestinationsSuccess && destinations.length > 0
  const { data: pipelinesData, isSuccess: isPipelinesSuccess } = pipelinesResult
  const {
    data: sourcesData,
    isSuccess: isSourcesSuccess,
    isError: isSourcesError,
    error: sourcesError,
    refetch: refetchSources,
  } = sourcesResult
  const externalReplicationSource = sourcesData?.sources.find(
    (source) => source.name === projectRef
  )
  const replicationNotEnabled = isSourcesSuccess && !externalReplicationSource

  const canDisablePipelines =
    isSourcesSuccess &&
    isDestinationsSuccess &&
    isPipelinesSuccess &&
    !!externalReplicationSource &&
    destinations.length === 0 &&
    pipelines.length === 0

  const isLocalPipelinesNotSetUp = checkLocalPipelinesNotSetUp(destinationsError)
  const hasErrorsFetchingData = !isLocalPipelinesNotSetUp && isDestinationsError

  const canCreate = isSourcesSuccess && !isCreationGateLoading
  const isCheckingPipelineStatus = isCreationGateLoading || (!isSourcesSuccess && !isSourcesError)
  const sourceErrorTitle = checkLocalPipelinesNotSetUp(sourcesError)
    ? 'Replication unavailable locally'
    : 'Failed to retrieve pipeline enablement status'

  const canLinkToWizard =
    isWizardEnabled && hasWizardDestination && !!projectRef && !replicationNotEnabled && canCreate
  const wizardLink = linkOptions({
    to: '/project/$ref/database/pipelines/new',
    params: { ref: projectRef ?? '_' },
    search: { cluster_id: clusterId },
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
      queryClient.getQueryState(replicationKeys.sources(projectRef, clusterId))?.status ===
        'success'
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
          queryKey: replicationKeys.pipelinesVersion(projectRef, p.id, clusterId),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion({ projectRef, pipelineId: p.id, clusterId }, signal),
          staleTime: Infinity,
        })
      })
    }
  }, [projectRef, clusterId, pipelinesData?.pipelines, isPipelinesSuccess, queryClient])

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

        {hasErrorsFetchingData && (
          <AlertError error={destinationsError} subject="Failed to retrieve pipelines" />
        )}

        {isDestinationsLoading && (
          <GenericTableLoader headers={[null, 'Name', 'Status', 'Lag', 'Publication', null]} />
        )}

        {!isDestinationsLoading && hasDestinations && (
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
                  {sortedDestinations.map(({ destination }) => (
                    <DestinationRow key={destination.id} destinationId={destination.id} />
                  ))}

                  {!isDestinationsLoading && sortedDestinations.length === 0 && hasDestinations && (
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
              {canLinkToWizard ? <Link {...wizardLink}>Add pipeline</Link> : 'Add pipeline'}
            </ButtonTooltip>
          </EmptyStatePresentational>
        )}
      </div>

      <DestinationPanel />

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
