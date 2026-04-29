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
import { GenericSkeletonLoader } from 'ui-patterns'
import { Input } from 'ui-patterns/DataInputs/Input'

import { REPLICA_STATUS } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisableExternalReplicationDialog } from './DisableExternalReplicationDialog'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { ReadReplicaRow } from './ReadReplicas/ReadReplicaRow'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
} from './useIsETLPrivateAlpha'
import { AlertError } from '@/components/ui/AlertError'
import { DocsButton } from '@/components/ui/DocsButton'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from '@/lib/constants'

export const Destinations = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()

  const etlEnableBigQuery = useIsETLBigQueryPrivateAlpha()
  const etlEnableIceberg = useIsETLIcebergPrivateAlpha()
  const etlEnableDucklake = useIsETLDucklakePrivateAlpha()
  const { infrastructureReadReplicas } = useIsFeatureEnabled(['infrastructure:read_replicas'])

  const newDestinationDefaultType = infrastructureReadReplicas
    ? 'Read Replica'
    : etlEnableBigQuery
      ? 'BigQuery'
      : etlEnableIceberg
        ? 'Analytics Bucket'
        : etlEnableDucklake
          ? 'DuckLake'
          : null

  const prefetchedRef = useRef(false)
  const [filterString, setFilterString] = useState<string>('')
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)
  const [showDisableExternalReplicationDialog, setShowDisableExternalReplicationDialog] =
    useState(false)

  const [_, setDestinationType] = useQueryState(
    'destinationType',
    parseAsStringEnum<DestinationType>([
      'Read Replica',
      'BigQuery',
      'Analytics Bucket',
      'DuckLake',
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
  const readReplicas = databases.filter((x) => x.identifier !== projectRef)
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
  const canDisableExternalReplication =
    isSourcesSuccess &&
    isDestinationsSuccess &&
    isPipelinesSuccess &&
    !!externalReplicationSource &&
    destinations.length === 0 &&
    pipelines.length === 0

  const isLoading = isDestinationsLoading || isDatabasesLoading
  const hasErrorsFetchingData = isDestinationsError || isDatabasesError

  const openDestinationPanel = () => {
    if (!newDestinationDefaultType) return
    setDestinationType(newDestinationDefaultType)
  }

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
              placeholder="Filter destinations"
              size="tiny"
              icon={<Search />}
              value={filterString}
              className="w-full lg:w-52"
              onChange={(e) => setFilterString(e.target.value)}
              actions={
                filterString.length > 0 && (
                  <Button
                    type="text"
                    icon={<X />}
                    className="p-0 h-5 w-5"
                    onClick={() => setFilterString('')}
                  />
                )
              }
            />
          </div>
          <div className="flex items-center gap-x-2">
            <Button
              type="default"
              icon={<Plus />}
              disabled={!newDestinationDefaultType}
              onClick={openDestinationPanel}
            >
              Add destination
            </Button>
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
            {canDisableExternalReplication && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="default" icon={<MoreVertical />} className="w-7" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuItem onClick={() => setShowDisableExternalReplicationDialog(true)}>
                    Disable external replication
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
            subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_DESTINATIONS}
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
                    <TableHead key="lag" className="w-[80px]">
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
                        <TableCell colSpan={5}>
                          <p>No results found</p>
                          <p className="text-foreground-light">
                            Your search for "{filterString}" did not return any results
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
                Deploy read replicas for lower latency and better resource management, or capture
                database changes to external platforms for real-time data pipelines.
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

      <DisableExternalReplicationDialog
        open={showDisableExternalReplicationDialog}
        setOpen={setShowDisableExternalReplicationDialog}
      />
    </>
  )
}
