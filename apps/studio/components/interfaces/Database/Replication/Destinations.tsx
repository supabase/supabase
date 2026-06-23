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

import { getHighAvailabilityFailoverReplicas } from '../../Settings/Infrastructure/Infrastructure.mock'
import { REPLICA_STATUS } from '../../Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { DestinationPanel } from './DestinationPanel/DestinationPanel'
import { DestinationType } from './DestinationPanel/DestinationPanel.types'
import { DestinationRow } from './DestinationRow'
import { DisableExternalReplicationDialog } from './DisableExternalReplicationDialog'
import { ReadReplicaRow } from './ReadReplicas/ReadReplicaRow'
import {
  useIsETLBigQueryPrivateAlpha,
  useIsETLDucklakePrivateAlpha,
  useIsETLIcebergPrivateAlpha,
  useIsETLSnowflakePrivateAlpha,
} from './useIsETLPrivateAlpha'
import { AlertError } from '@/components/ui/AlertError'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DocsButton } from '@/components/ui/DocsButton'
import { Shortcut } from '@/components/ui/Shortcut'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { useReplicationDestinationsQuery } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { useReplicationPipelinesQuery } from '@/data/replication/pipelines-query'
import { useReplicationSourcesQuery } from '@/data/replication/sources-query'
import { HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES } from '@/hooks/misc/useHighAvailability'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'
import { useShortcut } from '@/state/shortcuts/useShortcut'

interface DestinationsProps {
  readOnly?: boolean
}

export const Destinations = ({ readOnly = false }: DestinationsProps) => {
  const queryClient = useQueryClient()
  const { ref: projectRef } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const addDestinationDisabledTooltip = readOnly
    ? HIGH_AVAILABILITY_REPLICATION_DISABLED_MESSAGES.addDestinationTooltip
    : undefined
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
  const [statusRefetchInterval, setStatusRefetchInterval] = useState<number | false>(
    readOnly ? false : 5000
  )
  const [showDisableExternalReplicationDialog, setShowDisableExternalReplicationDialog] =
    useState(false)

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

  const failoverReplicas = useMemo(
    () => (readOnly ? getHighAvailabilityFailoverReplicas(project?.region) : []),
    [readOnly, project?.region]
  )
  const failoverReplicaDisplayNames = useMemo(
    () =>
      Object.fromEntries(
        failoverReplicas.map(({ replica, displayName }) => [replica.identifier, displayName])
      ),
    [failoverReplicas]
  )

  const {
    data: databases = [],
    error: databasesError,
    isLoading: isDatabasesLoading,
    isError: isDatabasesError,
    isSuccess: isDatabasesSuccess,
  } = useReadReplicasQuery(
    { projectRef },
    {
      enabled: !readOnly && !!projectRef,
      refetchInterval: readOnly ? false : statusRefetchInterval,
    }
  )
  const readReplicas = useMemo(() => {
    if (readOnly) return failoverReplicas.map(({ replica }) => replica)
    return databases.filter((database) => database.identifier !== projectRef)
  }, [databases, failoverReplicas, projectRef, readOnly])
  const replicaStatusSignature = useMemo(
    () => readReplicas.map((replica) => `${replica.identifier}:${replica.status}`).join('|'),
    [readReplicas]
  )
  const hasReplicas = readOnly
    ? failoverReplicas.length > 0
    : isDatabasesSuccess && readReplicas.length > 0
  const filteredReplicas =
    filterString.length === 0
      ? readReplicas
      : readReplicas.filter((replica) => {
          const displayName = failoverReplicaDisplayNames[replica.identifier]
          const searchTarget = (displayName ?? replica.identifier).toLowerCase()
          return searchTarget.includes(filterString.toLowerCase())
        })

  const {
    data: destinationsData,
    error: destinationsError,
    isLoading: isDestinationsLoading,
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

  const { data: pipelinesData, isSuccess: isPipelinesSuccess } = useReplicationPipelinesQuery(
    { projectRef },
    { enabled: !readOnly }
  )
  const pipelines = pipelinesData?.pipelines ?? []

  const { data: sourcesData, isSuccess: isSourcesSuccess } = useReplicationSourcesQuery(
    { projectRef },
    { enabled: !readOnly }
  )
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

  const isLoading =
    readOnly && failoverReplicas.length > 0
      ? false
      : readOnly
        ? isDestinationsLoading
        : isDestinationsLoading || isDatabasesLoading
  const hasErrorsFetchingData = readOnly
    ? isDestinationsError
    : isDestinationsError || isDatabasesError

  const openDestinationPanel = () => {
    if (readOnly || !newDestinationDefaultType) return
    setDestinationType(newDestinationDefaultType)
  }

  const canAddDestination = !readOnly && !!newDestinationDefaultType

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
    if (readOnly || !isDatabasesSuccess) return

    const fixedStatuses = [
      REPLICA_STATUS.ACTIVE_HEALTHY,
      REPLICA_STATUS.ACTIVE_UNHEALTHY,
      REPLICA_STATUS.INIT_READ_REPLICA_FAILED,
    ]

    const replicasInTransition = readReplicas.filter((db) => !fixedStatuses.includes(db.status))
    const hasTransientStatus = replicasInTransition.length > 0

    // If all replicas are active healthy, stop fetching statuses
    if (!hasTransientStatus) setStatusRefetchInterval(false)
  }, [isDatabasesSuccess, readOnly, replicaStatusSignature, readReplicas])

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
              options={{ enabled: canAddDestination }}
              side="bottom"
              tooltipOpen={readOnly ? false : undefined}
            >
              <ButtonTooltip
                variant="default"
                icon={<Plus />}
                disabled={!canAddDestination}
                onClick={openDestinationPanel}
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: addDestinationDisabledTooltip,
                  },
                }}
              >
                Add destination
              </ButtonTooltip>
            </Shortcut>
            <DocsButton href={`${DOCS_URL}/guides/database/replication`} />
            {canDisableExternalReplication && !readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="default" icon={<MoreVertical />} className="w-7" />
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
                        displayName={failoverReplicaDisplayNames[replica.identifier]}
                        readOnly={readOnly}
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
                Deploy read replicas for lower latency and better resource management, or capture
                database changes to external destinations for real-time data pipelines.
              </p>
              <ButtonTooltip
                icon={<Plus />}
                disabled={!canAddDestination}
                onClick={openDestinationPanel}
                className="mt-4"
                tooltip={{
                  content: {
                    side: 'bottom',
                    text: addDestinationDisabledTooltip,
                  },
                }}
              >
                Add destination
              </ButtonTooltip>
            </div>
          )
        )}
      </div>

      {!readOnly && (
        <DestinationPanel onSuccessCreateReadReplica={() => setStatusRefetchInterval(5000)} />
      )}

      <DisableExternalReplicationDialog
        open={showDisableExternalReplicationDialog}
        setOpen={setShowDisableExternalReplicationDialog}
      />
    </>
  )
}
