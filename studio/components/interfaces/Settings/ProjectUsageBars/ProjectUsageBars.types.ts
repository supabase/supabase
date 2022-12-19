export interface ResourceUsage {
  usage: number
  limit: number
  cost: number
  available_in_plan: boolean
}

export interface UsageStats {
  [key: string]: ResourceUsage
}
