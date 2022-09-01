export interface ResourceUsage {
  usage: number
  limit: number
}

export interface UsageStats {
  [key: string]: ResourceUsage
}
