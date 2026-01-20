import { useQueryClient } from '@tanstack/react-query'
import { Plus, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import {
  ReplicaInitializationStatus,
  useReadReplicasStatusesQuery,
} from '@/data/read-replicas/replicas-status-query'
import { useFlag, useParams } from 'common'
import { AlertError } from 'components/ui/AlertError'
import { DocsButton } from 'components/ui/DocsButton'
import { useReplicationDestinationsQuery } from 'data/replication/destinations-query'
import { replicationKeys } from 'data/replication/keys'
import { fetchReplicationPipelineVersion } from 'data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from 'data/replication/pipelines-query'
import { useReplicationSourcesQuery } from 'data/replication/sources-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { DOCS_URL } from 'lib/constants'
import {
  Button,
  Card,
  CardContent,
  cn,
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
import { DestinationRow } from './DestinationRow'
import { EnableReplicationCallout } from './EnableReplicationCallout'
import { PIPELINE_ERROR_MESSAGES } from './Pipeline.utils'
import { ReadReplicaRow } from './ReadReplicas/ReadReplicaRow'

export const Destinations = () => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { hasAccess: hasETLReplicationAccess, isLoading: isLoadingEntitlement } =
    useCheckEntitlements('replication.etl')

  const unifiedReplication = useFlag('unifiedReplication')

  const prefetchedRef = useRef(false)
  const [filterString, setFilterString] = useState<string>('')
  const [showNewDestinationPanel, setShowNewDestinationPanel] = useState(false)
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(5000)

  const {
    data: databases = [],
    error: databasesError,
    isPending: isDatabasesLoading,
    isError: isDatabasesError,
    isSuccess: isDatabasesSuccess,
    refetch: refetchDatabases,
  } = useReadReplicasQuery({
    projectRef,
  })
  const readReplicas = databases.filter((x) => x.identifier !== projectRef)
  const hasReplicas = isDatabasesSuccess && readReplicas.length > 0
  const filteredReplicas =
    filterString.length === 0
      ? readReplicas
      : readReplicas.filter((replica) => replica.identifier.includes(filterString.toLowerCase()))

  const { data: statuses = [], isSuccess: isSuccessReplicasStatuses } =
    useReadReplicasStatusesQuery({ projectRef }, { refetchInterval: statusRefetchInterval })

  const {
    data: sourcesData,
    error: sourcesError,
    isPending: isSourcesLoading,
    isError: isSourcesError,
    isSuccess: isSourcesSuccess,
  } = useReplicationSourcesQuery({
    projectRef,
  })
  const sourceId = sourcesData?.sources.find((s) => s.name === projectRef)?.id
  const replicationNotEnabled = isSourcesSuccess && !sourceId

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
      ? destinations ?? []
      : (destinations ?? []).filter((destination) =>
          destination.name.toLowerCase().includes(filterString.toLowerCase())
        )

  const {
    data: pipelinesData,
    error: pipelinesError,
    isPending: isPipelinesLoading,
    isError: isPipelinesError,
    isSuccess: isPipelinesSuccess,
  } = useReplicationPipelinesQuery({
    projectRef,
  })

  const isLoading =
    isSourcesLoading || isDestinationsLoading || isDatabasesLoading || isLoadingEntitlement
  const hasErrorsFetchingData = isSourcesError || isDestinationsError || isDatabasesError

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
    if (!isSuccessReplicasStatuses) return

    const pollReplicas = async () => {
      const fixedStatuses = [
        REPLICA_STATUS.ACTIVE_HEALTHY,
        REPLICA_STATUS.ACTIVE_UNHEALTHY,
        REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
      ]
      const replicasInTransition = statuses.filter((db) => {
        const { status } = db.replicaInitializationStatus || {}
        return (
          !fixedStatuses.includes(db.status) || status === ReplicaInitializationStatus.InProgress
        )
      })
      const hasTransientStatus = replicasInTransition.length > 0

      // If any replica's status has changed, refetch databases
      if (statuses.length !== databases.length) {
        await refetchDatabases()
      }

      // If all replicas are active healthy, stop fetching statuses
      if (!hasTransientStatus && statuses.length === databases.length) {
        setStatusRefetchInterval(false)
      }
    }

    pollReplicas()
  }, [databases.length, isSuccessReplicasStatuses, refetchDatabases, statuses])

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
            {(unifiedReplication || !!sourceId) && (
              <Button
                type="default"
                icon={<Plus />}
                onClick={() => setShowNewDestinationPanel(true)}
              >
                Add destination
              </Button>
            )}
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
          </div>
        </div>
      </div>

      <div className="w-full overflow-hidden overflow-x-auto">
        {hasErrorsFetchingData && (
          <AlertError
            error={sourcesError || destinationsError || databasesError}
            subject={PIPELINE_ERROR_MESSAGES.RETRIEVE_DESTINATIONS}
          />
        )}

        {isLoading ? (
          <GenericSkeletonLoader />
        ) : !unifiedReplication && replicationNotEnabled ? (
          <EnableReplicationCallout hasAccess={hasETLReplicationAccess} />
        ) : (unifiedReplication && hasReplicas) || hasDestinations ? (
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
                  {unifiedReplication &&
                    filteredReplicas.map((replica) => {
                      const status = statuses.find((x) => x.identifier === replica.identifier)
                      return (
                        <ReadReplicaRow
                          key={replica.identifier}
                          replica={replica}
                          replicaStatus={status}
                          onUpdateReplica={() => setStatusRefetchInterval(5000)}
                        />
                      )
                    })}

                  {filteredDestinations.map((destination) => {
                    const pipeline = pipelinesData?.pipelines.find(
                      (p) => p.destination_id === destination.id
                    )

                    const type =
                      'big_query' in destination.config
                        ? 'BigQuery'
                        : 'iceberg' in destination.config
                          ? 'Analytics Bucket'
                          : undefined

                    return (
                      <DestinationRow
                        key={destination.id}
                        sourceId={sourceId}
                        destinationId={destination.id}
                        destinationName={destination.name}
                        type={type}
                        pipeline={pipeline}
                        error={pipelinesError}
                        isLoading={isPipelinesLoading}
                        isError={isPipelinesError}
                        isSuccess={isPipelinesSuccess}
                      />
                    )
                  })}

                  {!isLoading &&
                    filteredDestinations.length === 0 &&
                    filteredReplicas.length === 0 &&
                    ((unifiedReplication && hasReplicas) || hasDestinations) && (
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
                'flex flex-col px-10 rounded-lg justify-center items-center py-8 mt-4'
              )}
            >
              <h4>Create your first destination</h4>
              <p className="prose text-sm text-center mt-1 max-w-[70ch]">
                Destinations are external platforms where your database changes are automatically
                sent. Connect to various data warehouses and analytics platforms to enable real-time
                data pipelines.
              </p>
              <Button
                icon={<Plus />}
                onClick={() => setShowNewDestinationPanel(true)}
                className="mt-4"
              >
                Add destination
              </Button>
            </div>
          )
        )}
      </div>

      <DestinationPanel
        visible={showNewDestinationPanel}
        onClose={() => setShowNewDestinationPanel(false)}
        onSuccessCreateReadReplica={() => setStatusRefetchInterval(5000)}
      />
    </>
  )
}
