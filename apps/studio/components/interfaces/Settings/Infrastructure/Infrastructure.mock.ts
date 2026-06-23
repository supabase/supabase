/**
 * Mock data for the Infrastructure page prototype.
 *
 * This models the abstraction we're settling on ahead of the Multigres launch. The shapes here
 * intentionally mirror the proposed `config.toml` so the prototype can become a stepping stone to
 * the real, infrastructure-agnostic config:
 *
 *   [database]
 *   home_region = "us-east-1"
 *   regions = ["us-east-1", "us-west-2"]
 *
 *   [database.availability]
 *   enabled = true
 *   level = "regional"
 *
 *   [database.reads]
 *   routing = "nearest"
 *
 *   [database.scaling]
 *   enabled = true
 *   multigres_sku = "mg-small"
 *
 *   [[database.scaling.table_groups]]
 *   name = "tenant_data"
 *   tables = ["projects", "tasks", "comments"]
 *   shard_key = "organization_id"
 *   shards = 8
 *
 * Everything below is mock/local-only — none of it talks to the platform API yet.
 */
import { AWS_REGIONS } from 'shared-data'

import { REPLICA_STATUS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import type { Database } from '@/data/read-replicas/replicas-query'

export type AvailabilityLevel = 'zonal' | 'regional'
export type ReadRouting = 'nearest' | 'primary' | 'round_robin'

export type TableGroupSyncStatus = 'synced' | 'syncing'

export interface TableGroup {
  name: string
  tables: string[]
  shardKey: string
  shards: number
  syncStatus: TableGroupSyncStatus
}

export interface InfrastructureMockConfig {
  homeRegion: string
  regions: string[]
  replicas?: {
    label: string
    region: string
    status: 'healthy' | 'warning' | 'error'
  }[]
  availability: {
    enabled: boolean
    level: AvailabilityLevel
  }
  reads: {
    routing: ReadRouting
  }
  scaling: {
    enabled: boolean
    computeSize: string
    diskSizeGb: number
    multigresSku: string
    tableGroups: TableGroup[]
  }
}

export type InfrastructureMockConfigPatch = {
  homeRegion?: string
  regions?: string[]
  replicas?: InfrastructureMockConfig['replicas']
  availability?: Partial<InfrastructureMockConfig['availability']>
  reads?: Partial<InfrastructureMockConfig['reads']>
  scaling?: Partial<InfrastructureMockConfig['scaling']>
}

export const INFRASTRUCTURE_MOCK_CONFIG: InfrastructureMockConfig = {
  homeRegion: 'us-east-1',
  regions: ['us-east-1', 'us-west-2'],
  availability: {
    enabled: true,
    level: 'regional',
  },
  reads: {
    routing: 'nearest',
  },
  scaling: {
    enabled: false,
    computeSize: 'small',
    diskSizeGb: 8,
    multigresSku: 'mg-small',
    tableGroups: [
      {
        name: 'tenant_data',
        tables: ['projects', 'tasks', 'comments'],
        shardKey: 'organization_id',
        shards: 8,
        syncStatus: 'synced',
      },
    ],
  },
}

export const buildHighAvailabilityMockConfig = ({
  homeRegion = 'us-east-1',
  computeSize = 'small',
}: {
  homeRegion?: string
  computeSize?: string
} = {}): InfrastructureMockConfig => ({
  homeRegion,
  regions: [homeRegion],
  replicas: [
    {
      label: 'Failover Replica (AZ-a)',
      region: homeRegion,
      status: 'healthy',
    },
    {
      label: 'Failover Replica (AZ-b)',
      region: homeRegion,
      status: 'healthy',
    },
  ],
  availability: {
    enabled: true,
    level: 'zonal',
  },
  reads: {
    routing: 'primary',
  },
  scaling: {
    enabled: false,
    computeSize,
    diskSizeGb: 8,
    multigresSku: 'mg-small',
    tableGroups: [],
  },
})

export type HighAvailabilityFailoverReplica = {
  replica: Database
  displayName: string
}

export function getHighAvailabilityFailoverReplicas(
  homeRegion = 'us-east-1'
): HighAvailabilityFailoverReplica[] {
  const { replicas = [] } = buildHighAvailabilityMockConfig({ homeRegion })

  return replicas.map((replica, index) => ({
    displayName: replica.label,
    replica: {
      identifier: `ha-failover-az-${String.fromCharCode(97 + index)}`,
      region: replica.region,
      status: REPLICA_STATUS.ACTIVE_HEALTHY,
    } as Database,
  }))
}

export interface ComputeSizeOption {
  value: string
  label: string
  specs: string
}

export const COMPUTE_SIZE_OPTIONS: ComputeSizeOption[] = [
  { value: 'nano', label: 'Nano', specs: 'Up to 0.5 GB RAM · shared CPU' },
  { value: 'micro', label: 'Micro', specs: '1 GB RAM · 2-core CPU' },
  { value: 'small', label: 'Small', specs: '2 GB RAM · 2-core CPU' },
  { value: 'medium', label: 'Medium', specs: '4 GB RAM · 2-core CPU' },
  { value: 'large', label: 'Large', specs: '8 GB RAM · 2-core CPU' },
  { value: 'xl', label: 'XL', specs: '16 GB RAM · 4-core CPU' },
]

export interface MultigresSkuOption {
  value: string
  label: string
  specs: string
}

export const MULTIGRES_SKU_OPTIONS: MultigresSkuOption[] = [
  { value: 'mg-small', label: 'MG Small', specs: '2 vCPU · 8 GB RAM · 100 GB NVMe' },
  { value: 'mg-medium', label: 'MG Medium', specs: '4 vCPU · 16 GB RAM · 200 GB NVMe' },
  { value: 'mg-large', label: 'MG Large', specs: '8 vCPU · 32 GB RAM · 500 GB EBS' },
]

export const getMultigresSkuOption = (value: string) =>
  MULTIGRES_SKU_OPTIONS.find((option) => option.value === value)

export const getNextMultigresSkuOption = (value: string) => {
  const index = MULTIGRES_SKU_OPTIONS.findIndex((option) => option.value === value)
  return index === -1 ? undefined : MULTIGRES_SKU_OPTIONS[index + 1]
}

/** Each shard has a primary pod plus the replicas implied by the availability topology. */
export const getMultigresPostgresPodCount = (config: InfrastructureMockConfig) => {
  const replicaCount = !config.availability.enabled
    ? 0
    : config.availability.level === 'regional'
      ? config.regions.filter((region) => region !== config.homeRegion).length
      : 2
  const shardCount =
    config.scaling.tableGroups.length === 0
      ? 1
      : config.scaling.tableGroups.reduce((total, group) => total + Math.max(1, group.shards), 0)

  return shardCount * (1 + replicaCount)
}

/** Region code -> human readable label, derived from shared-data so it stays in sync. */
const REGION_LABEL_BY_CODE: Record<string, string> = Object.values(AWS_REGIONS).reduce(
  (acc, region) => {
    acc[region.code] = region.displayName
    return acc
  },
  {} as Record<string, string>
)

export const getRegionLabel = (code: string) => REGION_LABEL_BY_CODE[code] ?? code

export const AVAILABILITY_LEVEL_OPTIONS: {
  value: AvailabilityLevel
  label: string
  description: string
}[] = [
  {
    value: 'zonal',
    label: 'Zonal',
    description: 'Place replicas in separate availability zones within your home region.',
  },
  {
    value: 'regional',
    label: 'Regional',
    description: 'Spread replicas across regions to survive a regional outage.',
  },
]

export type VerticalScalingUsageSparklinePoint = {
  timestamp: string
  value: number
}

const MOCK_USAGE_DAYS = 7

/** Deterministic mock CPU/disk trends for the vertical scaling usage sparklines. */
function buildMockUsageSparkline(
  values: number[],
  daysAgo = MOCK_USAGE_DAYS - 1
): VerticalScalingUsageSparklinePoint[] {
  const now = Date.now()

  return values.map((value, index) => ({
    timestamp: new Date(now - (daysAgo - index) * 24 * 60 * 60 * 1000).toISOString(),
    value,
  }))
}

/** Peak CPU usage (%) over the last 7 days — trending upward toward upgrade territory. */
export const MOCK_VERTICAL_SCALING_CPU_USAGE = buildMockUsageSparkline([38, 44, 51, 58, 64, 71, 78])

/** Disk usage (%) over the last 7 days — climbing steadily but below critical levels. */
export const MOCK_VERTICAL_SCALING_DISK_USAGE = buildMockUsageSparkline([
  22, 28, 34, 41, 48, 54, 61,
])

export type RegionRequestShare = {
  region: string
  requestPercent: number
}

/** Request origin mix over the last 7 days — includes regions not yet deployed. */
export const MOCK_REGION_REQUEST_SHARES: RegionRequestShare[] = [
  { region: 'us-east-1', requestPercent: 42 },
  { region: 'us-west-2', requestPercent: 18 },
  { region: 'eu-west-1', requestPercent: 28 },
  { region: 'ap-southeast-1', requestPercent: 12 },
]

export const READ_ROUTING_OPTIONS: { value: ReadRouting; label: string; description: string }[] = [
  {
    value: 'nearest',
    label: 'Nearest replica',
    description: 'Route reads to the closest healthy replica.',
  },
  {
    value: 'primary',
    label: 'Primary only',
    description: 'Send reads to the primary for strongest consistency.',
  },
  {
    value: 'round_robin',
    label: 'Round robin',
    description: 'Spread reads across replicas to balance load.',
  },
]
