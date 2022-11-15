export interface ResourceUsage {
  usage: number
  limit: number
  cost: number
}

export interface UsageStats {
  [key: string]: ResourceUsage
}
