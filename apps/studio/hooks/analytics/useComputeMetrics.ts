import dayjs from 'dayjs'
import { useMemo } from 'react'

import { COMPUTE_METRICS_ATTRIBUTES, getComputeMetricAvailability } from './useComputeMetrics.utils'
import {
  parseConnectionsData,
  parseInfrastructureMetrics,
} from '@/components/interfaces/Observability/DatabaseInfrastructureSection.utils'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type ComputeMetrics = {
  cpu: number | null
  disk: number | null
  memory: number | null
  connections: { peak: number; max: number } | null
  isLoading: boolean
  isError: boolean
}

export function useComputeMetrics({ projectRef }: { projectRef?: string }): ComputeMetrics {
  const { data: project } = useSelectedProjectQuery()

  // Intentionally anchored to mount time so the query key stays stable across re-renders.
  // React Query's staleTime handles background refresh without shifting the window.
  const { startDate, endDate } = useMemo(() => {
    const now = dayjs()
    return {
      startDate: now.subtract(1, 'hour').toISOString(),
      endDate: now.toISOString(),
    }
  }, [])

  const {
    data: infraData,
    isLoading: infraLoading,
    isError,
  } = useInfraMonitoringAttributesQuery({
    projectRef,
    attributes: COMPUTE_METRICS_ATTRIBUTES,
    startDate,
    endDate,
    interval: '1h',
  })

  const {
    data: maxConnectionsData,
    isLoading: connectionsLoading,
    isError: isConnectionsError,
  } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const metrics = useMemo(() => parseInfrastructureMetrics(infraData), [infraData])
  const connections = useMemo(
    () => parseConnectionsData(infraData, maxConnectionsData),
    [infraData, maxConnectionsData]
  )
  const availability = getComputeMetricAvailability(infraData)

  return {
    cpu: availability.cpu ? (metrics?.cpu.current ?? null) : null,
    disk: availability.disk ? (metrics?.disk.current ?? null) : null,
    memory: availability.memory ? (metrics?.ram.current ?? null) : null,
    connections: availability.connections && !isConnectionsError ? connections : null,
    isLoading: infraLoading || connectionsLoading,
    isError,
  }
}
