export interface UsageStats {
  authUsers: number
  bucketSize: number
  dbSize: number
  dbTables: number
}

export interface ResourceUsage {
  usage: number
  limit: number
}

export interface UsageStatsUpdated {
  dbSize: ResourceUsage
  dbEgress: ResourceUsage
  storageSize: ResourceUsage
  storageEgress: ResourceUsage
}

export interface ApiUsageStats {
  authUsers: string | null
  bucketSize: string | null
  dbSize: string | null
  dbTables: string | null
}
