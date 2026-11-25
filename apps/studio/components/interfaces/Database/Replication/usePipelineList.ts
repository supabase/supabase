import { useQueries, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'

import { getStatusName } from './Pipeline.utils'
import { PipelineStatusName } from './Replication.constants'
import type { ReplicationClustersData } from '@/data/replication/clusters-query'
import { replicationDestinationsQueryOptions } from '@/data/replication/destinations-query'
import { replicationKeys } from '@/data/replication/keys'
import { replicationPipelineStatusQueryOptions } from '@/data/replication/pipeline-status-query'
import { fetchReplicationPipelineVersion } from '@/data/replication/pipeline-version-query'
import { replicationPipelinesQueryOptions } from '@/data/replication/pipelines-query'
import { replicationSourcesQueryOptions } from '@/data/replication/sources-query'
import { checkLocalPipelinesNotSetUp } from '@/data/replication/utils'

type PipelineListGroup = {
  clusterId?: string
  region?: ReplicationClustersData['regions'][number]
}

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

export function usePipelineList({
  projectRef,
  groups,
  filterString,
  sortColumn,
  sortDirection,
}: {
  projectRef?: string
  groups: PipelineListGroup[]
  filterString: string
  sortColumn: 'name' | 'status'
  sortDirection: 'asc' | 'desc'
}) {
  const queryClient = useQueryClient()
  const prefetchedClustersRef = useRef(new Set<string>())

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
    const error =
      destinationsResult.error ??
      pipelinesResult.error ??
      (group.clusterId === undefined ? null : sourcesResult.error)
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

  const pipelineEntries = clusterResults.flatMap(({ group, pipelines }) =>
    pipelines.map((pipeline) => ({ clusterId: group.clusterId, pipeline }))
  )

  // These queries share the rows' query keys, so each status is fetched once per pipeline.
  const statusResults = useQueries({
    queries: pipelineEntries.map(({ clusterId, pipeline }) =>
      replicationPipelineStatusQueryOptions({
        projectRef,
        pipelineId: pipeline.id,
        clusterId,
      })
    ),
  })
  const statuses = new Map(
    pipelineEntries.map(({ pipeline }, index) => [
      pipeline,
      getStatusName(statusResults[index].data?.status),
    ])
  )

  const search = filterString.toLowerCase()
  const sortedDestinations = clusterResults
    .flatMap(({ group, visibleDestinations, pipelinesByDestination }) =>
      visibleDestinations
        .filter(({ name }) => name.toLowerCase().includes(search))
        .map((destination) => {
          const pipeline = pipelinesByDestination.get(destination.id)
          return {
            group,
            destination,
            status: pipeline && statuses.get(pipeline),
          }
        })
    )
    .sort((a, b) => {
      const comparison = a.destination.name.localeCompare(b.destination.name)
      const nameComparison = sortDirection === 'asc' ? comparison : -comparison
      if (sortColumn === 'name') return nameComparison
      return compareStatusNames(a.status, b.status, sortDirection) || nameComparison
    })

  useEffect(() => {
    if (!projectRef) return
    clusterResults.forEach(({ group: { clusterId }, pipelinesResult, pipelines }) => {
      const prefetchKey = JSON.stringify([projectRef, clusterId])
      if (!pipelinesResult.isSuccess || pipelines.length === 0) return
      if (prefetchedClustersRef.current.has(prefetchKey)) return

      prefetchedClustersRef.current.add(prefetchKey)
      pipelines.forEach(({ id: pipelineId }) => {
        if (!pipelineId) return
        void queryClient.prefetchQuery({
          queryKey: replicationKeys.pipelinesVersion(projectRef, pipelineId, clusterId),
          queryFn: ({ signal }) =>
            fetchReplicationPipelineVersion({ projectRef, pipelineId, clusterId }, signal),
          staleTime: Infinity,
        })
      })
    })
  }, [clusterResults, projectRef, queryClient])

  return { clusterResults, sortedDestinations }
}
