import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { Database } from 'icons'
import { MessageSquare, MoreVertical, Plus, Search, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/router'
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
  TableRow,
} from 'ui'
import { Input } from 'ui-patterns/DataInputs/Input'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  getCreatePipelineHref,
  getFirstEnabledPipelineType,
  isPipelineDestinationType,
} from './CreatePipeline/CreatePipelineWizard.utils'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { EnablePipelinesModal } from './EnablePipelinesCallout'
import { PIPELINES_FEEDBACK_URL, REPLICA_STATUS } from './Replication.constants'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLClickHousePrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from './useIsETLPrivateAlpha'
import { ReadReplicaRow } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/ReadReplicaRow'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { DropdownMenuItemTooltip } from '@/components/ui/DropdownMenuItemTooltip'
import { Shortcut } from '@/components/ui/Shortcut'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { DOCS_URL } from '@/lib/constants'
import { onSearchInputEscape } from '@/lib/keyboard'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const Destinations = () => {
  const queryClient = useQueryClient()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { data: organization } = useSelectedOrganizationQuery()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const etlEnableClickHouse = useIsETLClickHousePrivateAlpha()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const firstPipelineType = getFirstEnabledPipelineType({
    BigQuery: etlEnableBigQuery,
    'Analytics Bucket': etlEnableIceberg,
    DuckLake: etlEnableDucklake,
    Snowflake: etlEnableSnowflake,
    ClickHouse: etlEnableClickHouse,
  })
  const canAddPipeline = firstPipelineType !== null
  const canAddReplica = infrastructureReadReplicas
  const canAddDestination = canAddPipeline || canAddReplica

  const prefetchedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState<string>('')
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)
  const [showEnablePipelinesDialog, setShowEnablePipelinesDialog] = useState(false)
  const [showDisablePipelinesDialog, setShowDisablePipelinesDialog] = useState(false)

  const [urlDestinationType, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
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
    data: databases = [],
    error: databasesError,
    isPending: isDatabasesLoading,
    isError: isDatabasesError,
    isSuccess: isDatabasesSuccess,
  } = useReadReplicasQuery({ projectRef }, { refetchInterval: statusRefetchInterval })
  // Memoise so the array reference is stable across renders. Without this
  // the polling useEffect below has an unstable dep, runs every render, and
  // its `setStatusRefetchInterval(false)` churn keeps the parent re-rendering
  // — which trips a latent ref-instability bug in @radix-ui/react-slot
  // (`composeRefs` is called per render instead of `useComposedRefs`) and
  // tanks the page with "Maximum update depth exceeded" via the Tooltip
  // trigger refs.
  const readReplicas = useMemo(
    () => databases.filter((x) => x.identifier !== projectRef),
    [databases, projectRef]
  )
  const hasReplicas = isDatabasesSuccess && readReplicas.length > 0
  const filteredReplicas =
    filterString.length === 0
      ? readReplicas
      : readReplicas.filter((replica) => replica.identifier.includes(filterString.toLowerCase()))

  const {
    data: destinationsData,
    error: destinationsError,
    isPending: isDestinationsLoading,
    isError: isDestinationsError,
    isSuccess: isDestinationsSuccess,
  } = useReplicationDestinationsQuery({
    projectRef,
  })
  const destinations = destinationsData?.destinations ?? []
  const hasDestinations = isDestinationsSuccess && destinationsData?.destinations.length > 0
  const filteredDestinations =
    filterString.length === 0
      ? (destinations ?? [])
      : (destinations ?? []).filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  const { data: pipelinesData, isSuccess: isPipelinesSuccess } = useReplicationPipelinesQuery({
    projectRef,
  })
  const pipelines = pipelinesData?.pipelines ?? []

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

  const isLoading = isDestinationsLoading || isDatabasesLoading

  const isLocalETLNotSetUp = checkLocalETLNotSetUp(destinationsError)
  const hasErrorsFetchingData = (!isLocalETLNotSetUp && isDestinationsError) || isDatabasesError

  const openReplicaPanel = () => {
    setDestinationType('Read Replica')
  }

  const openCreate = () => {
    if (!projectRef) return
    if (canAddPipeline && firstPipelineType) {
      router.push(getCreatePipelineHref(projectRef, firstPipelineType))
      return
    }
    if (canAddReplica) openReplicaPanel()
  }

  useEffect(() => {
    if (!projectRef || !isPipelineDestinationType(urlDestinationType)) return
    router.replace(getCreatePipelineHref(projectRef, urlDestinationType))
  }, [projectRef, router, urlDestinationType])

  useShortcut(
    SHORTCUT_IDS.LIST_PAGE_FOCUS_SEARCH,
    () => {
      searchInputRef.current?.focus()
      searchInputRef.current?.select()
    },
    { label: 'Search destinations' }
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

  useEffect(() => {
    if (!isDatabasesSuccess) return

    const pollReplicas = async () => {
      const fixedStatuses = [
        REPLICA_STATUS.ACTIVE_HEALTHY,
        REPLICA_STATUS.ACTIVE_UNHEALTHY,
        REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
      ]

      const replicasInTransition = readReplicas.filter((db) => !fixedStatuses.includes(db.status))
      const hasTransientStatus = replicasInTransition.length > 0

      // If all replicas are active healthy, stop fetching statuses
      if (!hasTransientStatus) setStatusRefetchInterval(false)
    }

    pollReplicas()
  }, [isDatabasesSuccess, readReplicas])

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Input
            ref={searchInputRef}
            placeholder="Filter destinations"
            size="tiny"
            icon={<Search />}
            value={filterString}
            className="w-full lg:w-52"
            onChange={(e) => setFilterString(e.target.value)}
            onKeyDown={onSearchInputEscape(filterString, setFilterString)}
            actions={
              filterString.length > 0 && (
                <Button
                  aria-label="Clear filter"
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
                className="px-1"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem asChild>
                <Link href={`/org/${organization?.slug}/usage#pipeline-initial-sync-data`}>
                  View Pipelines usage
                </Link>
              </DropdownMenuItem>
              {canAddReplica && (
                <DropdownMenuItem onClick={openReplicaPanel}>Add read replica</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {replicationNotEnabled ? (
                <DropdownMenuItem onClick={() => setShowEnablePipelinesDialog(true)}>
                  Enable Pipelines
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItemTooltip
                  disabled={!canDisablePipelines}
                  tooltip={{
                    content: {
                      side: 'left',
                      text: 'Remove all existing destinations before disabling Pipelines',
                    },
                  }}
                  onClick={() => setShowDisablePipelinesDialog(true)}
                >
                  Disable Pipelines
                </DropdownMenuItemTooltip>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button asChild variant="default" icon={<MessageSquare />}>
            <a href={PIPELINES_FEEDBACK_URL} target="_blank" rel="noreferrer noopener">
              Leave feedback
            </a>
          </Button>
          <DocsButton href={`${DOCS_URL}/guides/database/replication`} />

          <Shortcut
            id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
            label="Add destination"
            onTrigger={openCreate}
            options={{ enabled: canAddDestination }}
            side="bottom"
          >
            <Button
              variant="primary"
              icon={<Plus />}
              disabled={!canAddDestination}
              onClick={openCreate}
            >
              Add destination
            </Button>
          </Shortcut>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {hasErrorsFetchingData && (
          <AlertError
            error={destinationsError || databasesError}
            subject="Failed to retrieve destinations"
          />
        )}

        {isLoading ? (
          <GenericSkeletonLoader />
        ) : hasReplicas || hasDestinations ? (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead key="type" className="w-[20px]" />
                    <TableHead key="name" className="w-[250px]">
                      Name
                    </TableHead>
                    <TableHead key="status" className="w-[150px]">
                      Status
                    </TableHead>
                    <TableHead key="lag" className="w-[150px]">
                      Lag
                    </TableHead>
                    <TableHead key="publication">Publication</TableHead>
                    <TableHead key="actions" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReplicas.map((replica) => {
                    return (
                      <ReadReplicaRow
                        key={replica.identifier}
                        replica={replica}
                        onUpdateReplica={() => setStatusRefetchInterval(5000)}
                      />
                    )
                  })}

                  {filteredDestinations.map((destination) => (
                    <DestinationRow key={destination.id} destinationId={destination.id} />
                  ))}

                  {!isLoading &&
                    filteredDestinations.length === 0 &&
                    filteredReplicas.length === 0 &&
                    (hasReplicas || hasDestinations) && (
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
              icon={Database}
              title="Add a replication destination"
              description="Deploy a read replica for lower latency and workload isolation, or connect a Pipelines destination for analytics workloads."
            >
              <Button
                variant="default"
                icon={<Plus />}
                disabled={!canAddDestination}
                onClick={openCreate}
              >
                Add destination
              </Button>
            </EmptyStatePresentational>
          )
        )}
      </div>

      <DestinationPanel onSuccessCreateReadReplica={() => setStatusRefetchInterval(5000)} />

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
