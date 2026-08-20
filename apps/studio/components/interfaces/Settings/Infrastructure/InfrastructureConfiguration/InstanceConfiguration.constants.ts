import { ReadReplicaSetupError, ReadReplicaSetupProgress } from '@supabase/shared-types/out/events'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'

export interface Region {
  key: AWS_REGIONS_KEYS
  name: string
  region: string
  coordinates: [number, number]
}

export type NodeData = {
  id: string
  provider: string
  region: Region
  computeSize?: string
  status: string
  inserted_at: string
}

export type PrimaryNodeData = NodeData & {
  numReplicas: number
  numRegions: number
  hasLoadBalancer: boolean
}

export type LoadBalancerData = NodeData & {
  numDatabases: number
}

export type ReplicaNodeData = NodeData & {
  onSelectRestartReplica: () => void
  onSelectResizeReplica: () => void
  onSelectDropReplica: () => void
}

export type EdgeData = {
  status: string
  identifier: string
  connectionString: string | null | undefined
}

// ReactFlow is scaling everything by the factor of 2
export const NODE_WIDTH = 660
export const NODE_SEP = 20

// The region wrapper is a static, non-measured sibling node with a fixed size.
export const REGION_NODE_HEIGHT = 162

// The shard wrapper is a static, non-measured background node sized around its
// children, with room reserved above them for the group header pill.
export const SHARD_NODE_PADDING = 16
export const SHARD_HEADER_HEIGHT = 42

// dagre rank separation for the High Availability layout — leaves room for the
// shard group header between the gateway row and the primary row.
export const HA_RANKSEP = 96

// First-paint fallback heights for the dagre layout, only used before React
// Flow has measured the real nodes. Subsequent layouts use node.measured.height.
export const NODE_HEIGHT_FALLBACKS: Record<string, number> = {
  LOAD_BALANCER: 64,
  PRIMARY: 140,
  READ_REPLICA: 140,
  REGION: REGION_NODE_HEIGHT,
  HA_GATEWAY: 64,
  HA_PRIMARY: 150,
  HA_REPLICA: 90,
}

// [Joshen] Coordinates from https://github.com/tobilg/aws-edge-locations/blob/main/data/aws-edge-locations.json
// In the format of [lon, lat]
export const AWS_REGIONS_COORDINATES: { [key: string]: [number, number] } = {
  SOUTHEAST_ASIA: [103.8, 1.37],
  NORTHEAST_ASIA: [139.42, 35.41],
  NORTHEAST_ASIA_2: [126.98, 37.56],
  CENTRAL_CANADA: [-73.6, 45.5],
  WEST_US: [-121.96, 37.35],
  WEST_US_2: [-122.67, 45.51],
  EAST_US: [-78.45, 38.13],
  WEST_EU: [-8, 53],
  WEST_EU_2: [-0.1, 51],
  CENTRAL_EU: [8, 50],
  SOUTH_ASIA: [72.88, 19.08],
  OCEANIA: [151.2, -33.86],
  SOUTH_AMERICA: [-46.38, -23.34],
  CENTRAL_EU_2: [8.54, 47.45],
  EAST_US_2: [-83, 39.96],
  NORTH_EU: [17.91, 59.65],
  WEST_EU_3: [2.35, 48.86],
}

// [Joshen] Just to make sure that we just depend on AWS_REGIONS to determine available
export const AVAILABLE_REPLICA_REGIONS: Region[] = Object.keys(AWS_REGIONS)
  .map((key) => {
    return {
      key: key as AWS_REGIONS_KEYS,
      name: AWS_REGIONS?.[key as AWS_REGIONS_KEYS].displayName,
      region: AWS_REGIONS?.[key as AWS_REGIONS_KEYS].code,
      coordinates: AWS_REGIONS_COORDINATES[key],
    }
  })
  .filter((x) => x.coordinates !== undefined)

// [Joshen] Just a more user friendly language, so that all the verbs are progressive
export const INIT_PROGRESS = {
  [ReadReplicaSetupProgress.Requested]: 'Requesting replica instance',
  [ReadReplicaSetupProgress.Started]: 'Launching replica instance',
  [ReadReplicaSetupProgress.LaunchedReadReplicaInstance]: 'Initiating replica setup',
  [ReadReplicaSetupProgress.InitiatedReadReplicaSetup]: 'Downloading base backup',
  [ReadReplicaSetupProgress.DownloadedBaseBackup]: 'Replaying WAL archives',
  [ReadReplicaSetupProgress.ReplayedWalArchives]: 'Completing set up',
  [ReadReplicaSetupProgress.CompletedReadReplicaSetup]: 'Completed',
}

export const ERROR_STATES = {
  [ReadReplicaSetupError.ReadReplicaInstanceLaunchFailed]: 'Failed to launch replica',
  [ReadReplicaSetupError.InitiateReadReplicaSetupFailed]: 'Failed to initiate replica',
  [ReadReplicaSetupError.DownloadBaseBackupFailed]: 'Failed to download backup',
  [ReadReplicaSetupError.ReplayWalArchivesFailed]: 'Failed to replay WAL archives',
  [ReadReplicaSetupError.CompleteReadReplicaSetupFailed]: 'Failed to set up replica',
}
