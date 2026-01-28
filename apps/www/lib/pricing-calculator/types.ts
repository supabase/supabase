import type { PricingCalculatorPlan } from 'shared-data'

export type CurrentInfrastructure =
  | 'starting_fresh'
  | 'firebase'
  | 'aws_self_hosted'
  | 'auth0_plus_db'
  | 'other'

export type ProjectionPeriodMonths = 12 | 36

export type ComputeTier =
  | 'Micro'
  | 'Small'
  | 'Medium'
  | 'Large'
  | 'XL'
  | '2XL'
  | '4XL'
  | '8XL'
  | '12XL'
  | '16XL'

export type CalculatorStageId = 'stage1' | 'stage2' | 'stage3' | 'stage4'

export type FitStatus = 'ok' | 'overage' | 'unavailable' | 'limit_exceeded'

export type UsageDimension =
  | 'projects'
  | 'compute'
  | 'database_size'
  | 'storage_size'
  | 'egress'
  | 'mau'
  | 'sso'
  | 'phone_mfa'
  | 'realtime_peak_connections'
  | 'realtime_messages'
  | 'edge_invocations'
  | 'compliance'

export type TimeAllocationKey = 'auth' | 'database' | 'api' | 'devops'

export type TimeAllocation = Record<TimeAllocationKey, number>

export type CalculatorInputs = {
  // Stage 1
  projects: number
  currentInfrastructure: CurrentInfrastructure
  teamSize: number
  hourlyCostUsd: number
  needCompliance: boolean

  // Stage 2
  databaseSizeGb: number
  storageSizeGb: number
  egressGb: number
  mau: number
  needSso: boolean
  needPhoneMfa: boolean
  realtimePeakConnections: number
  realtimeMessages: number
  edgeInvocations: number
  computeTier: ComputeTier

  // Stage 3
  userGrowthRateMonthlyPct: number
  dataGrowthGbPerMonth: number
  projectionMonths: ProjectionPeriodMonths

  // Stage 4 (optional overrides)
  timeAllocationOverrides?: Partial<TimeAllocation>
}

export type CostLineItemKey =
  | 'subscription'
  | 'compute'
  | 'compute_credits'
  | 'database_overage'
  | 'storage_overage'
  | 'egress_overage'
  | 'mau_overage'
  | 'sso_overage'
  | 'realtime_peak_connections_overage'
  | 'realtime_messages_overage'
  | 'edge_invocations_overage'
  | 'phone_mfa_addon'

export type CostLineItem = {
  key: CostLineItemKey
  monthlyUsd: number
  details?: string[]
}

export type PlanEstimate = {
  plan: PricingCalculatorPlan
  totalMonthlyUsd: number
  fits: Record<UsageDimension, FitStatus>
  lineItems: CostLineItem[]
}

export type PricingReport = {
  inputs: CalculatorInputs
  estimates: Record<PricingCalculatorPlan, PlanEstimate>
  recommended: {
    plan: PricingCalculatorPlan
    reasons: string[]
  }
}

export type RoiSummary = {
  hoursRecoveredPerMonth: number
  hoursRecoveredPerYear: number
  valueRecoveredPerMonthUsd: number
  valueRecoveredPerYearUsd: number
  breakdown: Record<
    TimeAllocationKey,
    { hoursBefore: number; hoursRecovered: number; reductionPct: number }
  >
}

export type CompetitorKey =
  | 'supabase'
  | 'firebase'
  | 'auth0'
  | 'clerk'
  | 'self_hosted'
  | 'convex'
  | 'aws'

export type ComparisonPlatform = Exclude<CompetitorKey, 'supabase'>

export type CostComparison = {
  monthlyUsd: Record<CompetitorKey, number>
  annualUsd: Record<CompetitorKey, number>
}

export type ProjectionPoint = {
  monthIndex: number
  mau: number
  databaseSizeGb: number
  storageSizeGb: number
  egressGb: number
  supabaseMonthlyUsd: number
  competitorsMonthlyUsd: Record<ComparisonPlatform, number>
}

export type ProjectionSeries = {
  months: ProjectionPeriodMonths
  points: ProjectionPoint[]
  cumulative: {
    supabaseUsd: number
    competitorsUsd: Record<ComparisonPlatform, number>
    savingsUsd: Record<ComparisonPlatform, number>
  }
}
