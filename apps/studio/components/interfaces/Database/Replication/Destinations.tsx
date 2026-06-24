import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import { MoreVertical, Plus, Search, X } from 'lucide-react'
import { parseAsStringEnum, useQueryState } from 'nuqs'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Button,
  Card,
  CardContent,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import { Admonition, GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import { REPLICA_STATUS } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisablePipelinesDialog } from './DisablePipelinesDialog'
import { ReadReplicaRow } from './ReadReplicas/ReadReplicaRow'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from './useIsETLPrivateAlpha'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { Shortcut } from '@/components/ui/Shortcut'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { checkLocalETLNotSetUp } from '@/data/replication/utils'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

export const Destinations = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const etlEnableSnowflake = useIsETLSnowflakePrivateAlpha()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const newDestinationDefaultType = infrastructureReadReplicas
    ? 'Read Replica'
    : etlEnableBigQuery
      ? 'BigQuery'
      : etlEnableIceberg
        ? 'Analytics Bucket'
        : etlEnableDucklake
          ? 'DuckLake'
          : etlEnableSnowflake
            ? 'Snowflake'
            : null

  const prefetchedRef = useRef(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [filterString, setFilterString] = useState<string>('')
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)
  const [showDisablePipelinesDialog, setShowDisablePipelinesDialog] = useState(false)

  const [_, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
      'Snowflake',
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
    <>
      <div className="mb-4">
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
              actions={
                filterString.length > 0 && (
                  <Button
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
            <Shortcut
              id={SHORTCUT_IDS.LIST_PAGE_NEW_ITEM}
              label="Add destination"
              onTrigger={openDestinationPanel}
              options={{ enabled: !!newDestinationDefaultType }}
              side="bottom"
            >
              <Button
                variant="default"
                icon={<Plus />}
                disabled={!newDestinationDefaultType}
                onClick={openDestinationPanel}
              >
                Add destination
              </Button>
            </Shortcut>
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
            {canDisablePipelines && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" icon={<MoreVertical />} className="w-7" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setShowDisablePipelinesDialog(true)}>
                    Disable Pipelines
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto flex flex-col gap-y-4">
        {hasErrorsFetchingData && (
          <AlertError
            error={destinationsError || databasesError}
            subject="Failed to retrieve destinations"
          />
        )}

        {isLocalETLNotSetUp && (
          <Admonition
            type="default"
            title="ETL API not set up locally — destinations cannot be managed"
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
            <div
              className={cn(
                'w-full',
                'border border-dashed bg-surface-100 border-overlay',
                'flex flex-col px-16 rounded-lg justify-center items-center py-8 mt-4'
              )}
            >
              <h4>Replication keeps your data in sync across systems</h4>
              <p className="text-foreground-light text-sm text-balance text-center mt-1">
                Deploy Read Replicas for lower latency and workload isolation, or add a Pipelines
                destination for analytics workloads.
              </p>
              <Button
                icon={<Plus />}
                disabled={!newDestinationDefaultType}
                onClick={openDestinationPanel}
                className="mt-4"
              >
                Add destination
              </Button>
            </div>
          )
        )}
      </div>

      <DestinationPanel onSuccessCreateReadReplica={() => setStatusRefetchInterval(5000)} />

      <DisablePipelinesDialog
        open={showDisablePipelinesDialog}
        setOpen={setShowDisablePipelinesDialog}
      />
    </>
  )
}
