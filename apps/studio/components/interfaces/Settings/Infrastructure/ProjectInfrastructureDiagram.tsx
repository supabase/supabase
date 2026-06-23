import { useMemo } from 'react'
import { cn } from 'ui'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

import {
  buildHighAvailabilityMockConfig,
  type InfrastructureMockConfig,
} from './Infrastructure.mock'
import {
  INFRASTRUCTURE_CHARTS_OVERLAP_CLASS,
  INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS,
  InfrastructureDiagram,
} from './InfrastructureDiagram/InfrastructureDiagram'
import { InfrastructurePrototypeProvider } from './InfrastructurePrototypeContext'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { resolveHighAvailability } from '@/hooks/misc/useHighAvailability.constants'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const getReplicaStatus = (status?: string) => {
  if (status === 'ACTIVE_HEALTHY') return 'healthy' as const
  if (status === 'ACTIVE_UNHEALTHY' || status === 'INIT_FAILED') return 'error' as const
  return 'warning' as const
}

export const ProjectInfrastructureDiagram = ({
  embedded,
  bottomOverlap,
  isHighAvailability: isHighAvailabilityOverride,
}: {
  embedded?: boolean
  bottomOverlap?: boolean
  isHighAvailability?: boolean
} = {}) => {
  const { data: project, isLoading: isProjectLoading } = useSelectedProjectQuery()
  const isHighAvailability = isHighAvailabilityOverride ?? resolveHighAvailability(project)
  const homeRegion = project?.region ?? 'us-east-1'
  const computeSize = project?.infra_compute_size ?? 'small'

  const { data: databases = [], isLoading: areDatabasesLoading } = useReadReplicasQuery(
    { projectRef: project?.ref },
    { enabled: !isHighAvailability && !!project?.ref }
  )

  const readReplicaSignature = useMemo(
    () =>
      databases
        .filter((database) => database.identifier !== project?.ref)
        .map((replica) => `${replica.identifier}:${replica.region}:${replica.status}`)
        .join('|'),
    [databases, project?.ref]
  )

  const config = useMemo<InfrastructureMockConfig>(() => {
    if (isHighAvailability) {
      return buildHighAvailabilityMockConfig({
        homeRegion,
        computeSize,
      })
    }

    const readReplicas = databases.filter((database) => database.identifier !== project?.ref)

    return {
      homeRegion,
      regions: [homeRegion, ...readReplicas.map((replica) => replica.region)],
      replicas: readReplicas.map((replica, index) => ({
        label: `Read Replica ${index + 1}`,
        region: replica.region,
        status: getReplicaStatus(replica.status),
      })),
      availability: {
        enabled: readReplicas.length > 0,
        level: 'regional',
      },
      reads: {
        routing: 'nearest',
      },
      scaling: {
        enabled: false,
        computeSize,
        diskSizeGb: 8,
        multigresSku: 'mg-small',
        tableGroups: [],
      },
    }
  }, [computeSize, homeRegion, isHighAvailability, project?.ref, readReplicaSignature])

  const diagramProviderKey = isHighAvailability
    ? `ha:${homeRegion}:${computeSize}`
    : `standard:${homeRegion}:${computeSize}:${readReplicaSignature}`

  const isLoadingDiagram = isHighAvailability ? false : isProjectLoading || areDatabasesLoading

  if (isLoadingDiagram) {
    return (
      <div
        className={cn(
          embedded ? 'h-full' : 'border-y border-default',
          !embedded && INFRASTRUCTURE_DIAGRAM_HEIGHT_CLASS,
          bottomOverlap && INFRASTRUCTURE_CHARTS_OVERLAP_CLASS
        )}
      >
        <div className={cn('h-full', !embedded && 'px-6 py-8')}>
          <GenericSkeletonLoader />
        </div>
      </div>
    )
  }

  return (
    <InfrastructurePrototypeProvider key={diagramProviderKey} initialConfig={config}>
      <InfrastructureDiagram embedded={embedded} bottomOverlap={bottomOverlap} />
    </InfrastructurePrototypeProvider>
  )
}
