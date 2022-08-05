export interface UsageStats {
  authUsers: number
  bucketSize: number
  dbSize: number
  dbTables: number
}

export interface ApiUsageStats {
  authUsers: string | null
  bucketSize: string | null
  dbSize: string | null
  dbTables: string | null
}
