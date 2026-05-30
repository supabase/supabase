import dayjs from 'dayjs'
import { useMemo } from 'react'

import {
  parseConnectionsData,
  parseInfrastructureMetrics,
} from '@/components/interfaces/Observability/DatabaseInfrastructureSection.utils'
import { useInfraMonitoringAttributesQuery } from '@/data/analytics/infra-monitoring-query'
import { useMaxConnectionsQuery } from '@/data/database/max-connections-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

export type ComputeMetrics = {
  cpu: number
  disk: number
  memory: number
  connections: { current: number; max: number }
  isLoading: boolean
  isError: boolean
}

export function useComputeMetrics({ projectRef }: { projectRef?: string }): ComputeMetrics {
  const { data: project } = useSelectedProjectQuery()

  // Intentionally anchored to mount time so the query key stays stable across re-renders.
  // React Query's staleTime handles background refresh without shifting the window.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    attributes: [
      'avg_cpu_usage',
      'ram_usage',
      'disk_fs_used_system',
      'disk_fs_used_wal',
      'pg_database_size',
      'disk_fs_size',
      'pg_stat_database_num_backends',
    ],
    startDate,
    endDate,
    interval: '1h',
  })

  const { data: maxConnectionsData, isLoading: connectionsLoading } = useMaxConnectionsQuery({
    projectRef,
    connectionString: project?.connectionString,
  })

  const metrics = useMemo(() => parseInfrastructureMetrics(infraData), [infraData])
  const connections = useMemo(
    () => parseConnectionsData(infraData, maxConnectionsData),
    [infraData, maxConnectionsData]
  )

  return {
    cpu: metrics?.cpu.current ?? 0,
    disk: metrics?.disk.current ?? 0,
    memory: metrics?.ram.current ?? 0,
    connections,
    isLoading: infraLoading || connectionsLoading,
    isError,
  }
}
