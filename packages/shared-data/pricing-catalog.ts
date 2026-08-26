export type PlanKey = 'free' | 'pro' | 'team' | 'enterprise'
export type IncludedQuota = number | 'custom' | null
export type IncludedByPlan = Record<PlanKey, IncludedQuota>

export interface PlanBillingEntry {
  priceMonthly: number | null
  computeCreditsMonthly: number | null
  spendCapAvailable: boolean
}

export interface MeterEntry {
  product: 'database' | 'auth' | 'storage' | 'functions' | 'realtime' | null
  unified?: true
  scope: 'organization' | 'project' | 'branch' | 'pipeline'
  unit: string
  per: number
  price: number
  includedByPlan: IncludedByPlan
  billingNote?: string
}

export interface DiskAllowance {
  sizeGb: number
  iops: number
  throughputMBps: number
}

export interface DiskTypeEntry {
  type: 'gp3' | 'io2'
  displayName: string
  tagline: string
  maxSizeTb: number
  durabilityPercent: number
  includedPerProject: DiskAllowance | null
  perUnitMonth: { sizeGb: number; iops: number; throughputMBps: number | null }
  throughputNote?: string
}

export interface AddonAvailability {
  free: boolean
  pro: boolean
  team: boolean
  enterprise: boolean
}

export function usd(amount: number, decimals?: number): string {
  return `$${decimals === undefined ? String(amount) : amount.toFixed(decimals)}`
}

export function qty(n: number, style?: 'comma' | 'millionWord'): string {
  if (style === 'comma') return n.toLocaleString('en-US')
  if (style === 'millionWord') return `${n / 1_000_000} Million`
  return String(n)
}

const THIN_SPACE = ' '

export function withUnit(n: number, unit: string, style?: 'comma' | 'millionWord'): string {
  return `${qty(n, style)}${THIN_SPACE}${unit}`
}

export function gbDisplay(sizeGb: number): string {
  return sizeGb < 1 ? withUnit(sizeGb * 1000, 'MB') : withUnit(sizeGb, 'GB')
}

const GP3_PER_GB_MONTH = 0.125

export const PLAN_BILLING = {
  free: { priceMonthly: 0, computeCreditsMonthly: null, spendCapAvailable: false },
  pro: { priceMonthly: 25, computeCreditsMonthly: 10, spendCapAvailable: true },
  team: { priceMonthly: 599, computeCreditsMonthly: 10, spendCapAvailable: false },
  enterprise: { priceMonthly: null, computeCreditsMonthly: null, spendCapAvailable: false },
} as const satisfies Record<PlanKey, PlanBillingEntry>

export const DISK_PRICING: Record<'gp3' | 'io2', DiskTypeEntry> = {
  gp3: {
    type: 'gp3',
    displayName: 'General Purpose',
    tagline: 'Balance between price and performance',
    maxSizeTb: 16,
    durabilityPercent: 99.9,
    includedPerProject: { sizeGb: 8, iops: 3000, throughputMBps: 125 },
    perUnitMonth: { sizeGb: GP3_PER_GB_MONTH, iops: 0.024, throughputMBps: 0.095 },
  },
  io2: {
    type: 'io2',
    displayName: 'High Performance',
    tagline: 'For mission critical applications',
    maxSizeTb: 60,
    durabilityPercent: 99.999,
    includedPerProject: null,
    perUnitMonth: { sizeGb: 0.195, iops: 0.119, throughputMBps: null },
    throughputNote: 'Scales automatically with IOPS',
  },
}

export const METERS = {
  egress: {
    product: null,
    unified: true,
    scope: 'organization',
    unit: 'GB',
    per: 1,
    price: 0.09,
    includedByPlan: { free: 5, pro: 250, team: 250, enterprise: 'custom' },
    billingNote: 'unified across all products',
  },
  cachedEgress: {
    product: 'storage',
    scope: 'organization',
    unit: 'GB',
    per: 1,
    price: 0.03,
    includedByPlan: { free: 5, pro: 250, team: 250, enterprise: 'custom' },
  },
  databaseDiskSize: {
    product: 'database',
    scope: 'project',
    unit: 'GB',
    per: 1,
    price: GP3_PER_GB_MONTH,
    includedByPlan: { free: 0.5, pro: 8, team: 8, enterprise: 'custom' },
    billingNote: 'general-purpose (gp3) disk rate',
  },
  storageSize: {
    product: 'storage',
    scope: 'organization',
    unit: 'GB',
    per: 1,
    price: 0.0213,
    includedByPlan: { free: 1, pro: 100, team: 100, enterprise: 'custom' },
  },
  maus: {
    product: 'auth',
    scope: 'organization',
    unit: 'MAU',
    per: 1,
    price: 0.00325,
    includedByPlan: { free: 50_000, pro: 100_000, team: 100_000, enterprise: 'custom' },
  },
  thirdPartyMaus: {
    product: 'auth',
    scope: 'organization',
    unit: 'MAU',
    per: 1,
    price: 0.00325,
    includedByPlan: { free: 50_000, pro: 100_000, team: 100_000, enterprise: 'custom' },
  },
  ssoMaus: {
    product: 'auth',
    scope: 'organization',
    unit: 'MAU',
    per: 1,
    price: 0.015,
    includedByPlan: { free: null, pro: 50, team: 50, enterprise: 'custom' },
  },
  imageTransformations: {
    product: 'storage',
    scope: 'organization',
    unit: 'origin images',
    per: 1000,
    price: 5,
    includedByPlan: { free: null, pro: 100, team: 100, enterprise: 'custom' },
  },
  functionsInvocations: {
    product: 'functions',
    scope: 'organization',
    unit: 'invocations',
    per: 1_000_000,
    price: 2,
    includedByPlan: { free: 500_000, pro: 2_000_000, team: 2_000_000, enterprise: 'custom' },
  },
  realtimeConnections: {
    product: 'realtime',
    scope: 'organization',
    unit: 'concurrent peak connections',
    per: 1000,
    price: 10,
    includedByPlan: { free: 200, pro: 500, team: 500, enterprise: 'custom' },
  },
  realtimeMessages: {
    product: 'realtime',
    scope: 'organization',
    unit: 'messages',
    per: 1_000_000,
    price: 2.5,
    includedByPlan: { free: 2_000_000, pro: 5_000_000, team: 5_000_000, enterprise: 'custom' },
  },
  branching: {
    product: 'database',
    scope: 'branch',
    unit: 'branch-hours',
    per: 1,
    price: 0.01344,
    includedByPlan: { free: null, pro: 0, team: 0, enterprise: 'custom' },
  },
  replicationPipelineHours: {
    product: 'database',
    scope: 'pipeline',
    unit: 'pipeline-hours',
    per: 1,
    price: 0.053,
    includedByPlan: { free: null, pro: 0, team: 0, enterprise: 'custom' },
  },
  replicationOngoingGb: {
    product: 'database',
    scope: 'pipeline',
    unit: 'GB processed during ongoing replication',
    per: 1,
    price: 3,
    includedByPlan: { free: null, pro: 0, team: 0, enterprise: 'custom' },
  },
  replicationInitialSyncGb: {
    product: 'database',
    scope: 'pipeline',
    unit: 'GB processed during initial sync',
    per: 1,
    price: 0.6,
    includedByPlan: { free: null, pro: 0, team: 0, enterprise: 'custom' },
  },
} satisfies Record<string, MeterEntry>

export const ADDONS = {
  pitr: {
    scope: 'project',
    priceMonthlyPer7DaysRetention: 100,
    availability: { free: false, pro: true, team: true, enterprise: true },
  },
  customDomain: {
    scope: 'project',
    priceMonthlyPerDomain: 10,
    availability: { free: false, pro: true, team: true, enterprise: true },
  },
  advancedMfaPhone: {
    scope: 'project',
    priceMonthlyFirstProject: 75,
    priceMonthlyAdditionalProject: 10,
    availability: { free: false, pro: true, team: true, enterprise: true },
  },
  logDrain: {
    scope: 'project',
    priceMonthlyPerDrain: 60,
    perMillionEvents: 0.2,
    perGbEgress: 0.09,
    availability: { free: false, pro: true, team: true, enterprise: true },
  },
} as const
