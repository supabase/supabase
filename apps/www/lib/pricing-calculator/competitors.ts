import competitorSnapshot from '~/data/pricing-calculator-competitors.json'
import type { CalculatorInputs, CompetitorKey, ComparisonPlatform } from './types'

const roundUsd = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

export type CompetitorSnapshot = typeof competitorSnapshot

export function getCompetitorSnapshot(): CompetitorSnapshot {
  return competitorSnapshot
}

function interpolateFromAnchors(
  mau: number,
  anchors: Record<string, number | null>
): number | null {
  const sorted = Object.keys(anchors)
    .map(Number)
    .filter((k) => anchors[String(k)] != null)
    .sort((a, b) => a - b)

  if (sorted.length === 0) return null
  if (mau <= sorted[0]) return anchors[String(sorted[0])] as number
  if (mau >= sorted[sorted.length - 1]) {
    const lastKey = String(sorted[sorted.length - 1])
    const lastVal = anchors[lastKey] as number
    // Extrapolate: assume linear continuation from last anchor
    if (sorted.length >= 2) {
      const prevKey = String(sorted[sorted.length - 2])
      const prevVal = anchors[prevKey] as number
      const slope = (lastVal - prevVal) / (sorted[sorted.length - 1] - sorted[sorted.length - 2])
      return roundUsd(lastVal + (mau - sorted[sorted.length - 1]) * slope)
    }
    return lastVal
  }

  // Interpolate between anchors
  for (let i = 0; i < sorted.length - 1; i++) {
    if (mau >= sorted[i] && mau <= sorted[i + 1]) {
      const lowerKey = String(sorted[i])
      const upperKey = String(sorted[i + 1])
      const lowerVal = anchors[lowerKey] as number
      const upperVal = anchors[upperKey] as number
      const t = (mau - sorted[i]) / (sorted[i + 1] - sorted[i])
      return roundUsd(lowerVal + t * (upperVal - lowerVal))
    }
  }

  return null
}

export function estimateAuth0MonthlyUsd(mau: number): number | null {
  const snapshot = competitorSnapshot.providers.auth0
  return interpolateFromAnchors(mau, snapshot.monthly_cost_by_mau)
}

export function estimateClerkMonthlyUsd(mau: number): number | null {
  const snapshot = competitorSnapshot.providers.clerk
  return interpolateFromAnchors(mau, snapshot.monthly_cost_by_mau)
}

export function estimateFirebaseAuthMonthlyUsd(mau: number): number | null {
  const snapshot = competitorSnapshot.providers.firebase
  return interpolateFromAnchors(mau, snapshot.monthly_cost_by_mau)
}

export function estimateFirebaseMonthlyUsd(
  inputs: Pick<CalculatorInputs, 'mau' | 'egressGb'>
): number {
  // Use snapshot for Firebase Auth (Tier 1 providers)
  const authCost = estimateFirebaseAuthMonthlyUsd(inputs.mau) ?? 0

  // Note: Firestore is not priced per MAU; it's billed by reads/writes/storage.
  // For a full comparison, we'd need Firestore usage estimates, but for this prototype
  // we only include the auth component from the snapshot.
  return roundUsd(authCost)
}

export function estimateSelfHostedMonthlyUsd(
  inputs: Pick<CalculatorInputs, 'databaseSizeGb' | 'storageSizeGb' | 'egressGb' | 'projects'>
): number {
  // Prototype baseline for infra: per-project overhead + storage + bandwidth.
  const basePerProject = 75
  const dbPerGb = 0.25
  const storagePerGb = 0.02
  const egressPerGb = 0.05

  const dbTotalGb = inputs.databaseSizeGb * inputs.projects
  return roundUsd(
    inputs.projects * basePerProject +
      dbTotalGb * dbPerGb +
      inputs.storageSizeGb * storagePerGb +
      inputs.egressGb * egressPerGb
  )
}

export function estimateConvexMonthlyUsd(
  inputs: Pick<CalculatorInputs, 'mau' | 'databaseSizeGb' | 'storageSizeGb' | 'egressGb'>
): number {
  // Convex Professional plan: $25/month base includes 1M function calls, 0.5 GiB storage, 10 GiB bandwidth
  const BASE_MONTHLY = 25
  const INCLUDED_FUNCTION_CALLS = 1_000_000
  const INCLUDED_STORAGE_GB = 0.5
  const INCLUDED_BANDWIDTH_GB = 10

  // Estimate function calls: ~50 calls per MAU per month (typical backend workload)
  const functionCalls = inputs.mau * 50
  const functionCallsOverage = Math.max(0, functionCalls - INCLUDED_FUNCTION_CALLS)
  const functionCallsCost = functionCallsOverage * 0.00001 // $0.00001 per call

  // Storage: database + file storage
  const totalStorageGb = inputs.databaseSizeGb + inputs.storageSizeGb
  const storageOverage = Math.max(0, totalStorageGb - INCLUDED_STORAGE_GB)
  const storageCost = storageOverage * 0.2 // $0.20 per GiB

  // Bandwidth (egress)
  const bandwidthOverage = Math.max(0, inputs.egressGb - INCLUDED_BANDWIDTH_GB)
  const bandwidthCost = bandwidthOverage * 0.12 // $0.12 per GiB

  return roundUsd(BASE_MONTHLY + functionCallsCost + storageCost + bandwidthCost)
}

export function estimateAwsMonthlyUsd(
  inputs: Pick<
    CalculatorInputs,
    'databaseSizeGb' | 'storageSizeGb' | 'egressGb' | 'projects' | 'mau'
  >
): number {
  // AWS full stack estimate: RDS, S3, CloudFront, EC2, etc.
  // Assumes US East (N. Virginia) region pricing

  // RDS PostgreSQL: db.t3.micro ($15/mo) for small DBs, db.t3.small ($30/mo) for medium, db.t3.medium ($60/mo) for large
  // Scale based on database size
  let rdsCost = 0
  const dbTotalGb = inputs.databaseSizeGb * inputs.projects
  if (dbTotalGb <= 20) {
    rdsCost = 15 // db.t3.micro
  } else if (dbTotalGb <= 100) {
    rdsCost = 30 // db.t3.small
  } else if (dbTotalGb <= 500) {
    rdsCost = 60 // db.t3.medium
  } else {
    rdsCost = 150 // Larger instance estimate
  }
  rdsCost = rdsCost * inputs.projects // Per project

  // S3 storage: $0.023 per GB
  const s3StorageCost = inputs.storageSizeGb * 0.023

  // CloudFront egress: $0.085 per GB for first 10TB
  const cloudfrontCost = inputs.egressGb * 0.085

  // EC2 compute for API servers: t3.micro ($7.50/mo) to t3.small ($15/mo) per instance
  // Estimate 1-2 instances based on MAU
  const ec2Instances = inputs.mau < 10_000 ? 1 : 2
  const ec2Cost = ec2Instances * (inputs.mau < 50_000 ? 7.5 : 15)

  // Other services (Load Balancer, CloudWatch, etc.): ~$20-50/month baseline
  const otherServicesCost = 30

  return roundUsd(rdsCost + s3StorageCost + cloudfrontCost + ec2Cost + otherServicesCost)
}

export function estimateCompetitorKeyForInfrastructure(
  infra: CalculatorInputs['currentInfrastructure']
): CompetitorKey {
  switch (infra) {
    case 'firebase':
      return 'firebase'
    case 'aws_self_hosted':
      return 'self_hosted'
    case 'auth0_plus_db':
      return 'auth0'
    case 'starting_fresh':
    case 'other':
    default:
      return 'firebase'
  }
}

export function estimateCompetitorMonthlyUsdForKey(
  key: ComparisonPlatform,
  inputs: CalculatorInputs
): { key: CompetitorKey; monthlyUsd: number } {
  if (key === 'firebase') {
    return {
      key,
      monthlyUsd: estimateFirebaseMonthlyUsd({ mau: inputs.mau, egressGb: inputs.egressGb }),
    }
  }

  if (key === 'clerk') {
    const clerkCost = estimateClerkMonthlyUsd(inputs.mau)
    return { key, monthlyUsd: clerkCost ?? 0 }
  }

  if (key === 'auth0') {
    // Auth0 + separate database: model as Auth0 auth cost + a light self-hosted DB baseline
    const auth = estimateAuth0MonthlyUsd(inputs.mau) ?? 0
    const db = estimateSelfHostedMonthlyUsd({
      databaseSizeGb: inputs.databaseSizeGb,
      storageSizeGb: inputs.storageSizeGb,
      egressGb: inputs.egressGb,
      projects: inputs.projects,
    })
    return { key, monthlyUsd: roundUsd(auth + db) }
  }

  if (key === 'self_hosted') {
    return {
      key,
      monthlyUsd: estimateSelfHostedMonthlyUsd({
        databaseSizeGb: inputs.databaseSizeGb,
        storageSizeGb: inputs.storageSizeGb,
        egressGb: inputs.egressGb,
        projects: inputs.projects,
      }),
    }
  }

  if (key === 'convex') {
    return {
      key,
      monthlyUsd: estimateConvexMonthlyUsd({
        mau: inputs.mau,
        databaseSizeGb: inputs.databaseSizeGb,
        storageSizeGb: inputs.storageSizeGb,
        egressGb: inputs.egressGb,
      }),
    }
  }

  if (key === 'aws') {
    return {
      key,
      monthlyUsd: estimateAwsMonthlyUsd({
        databaseSizeGb: inputs.databaseSizeGb,
        storageSizeGb: inputs.storageSizeGb,
        egressGb: inputs.egressGb,
        projects: inputs.projects,
        mau: inputs.mau,
      }),
    }
  }

  return { key, monthlyUsd: 0 }
}

export function estimateCompetitorMonthlyUsd(inputs: CalculatorInputs): {
  key: CompetitorKey
  monthlyUsd: number
} {
  const key = estimateCompetitorKeyForInfrastructure(
    inputs.currentInfrastructure
  ) as ComparisonPlatform
  return estimateCompetitorMonthlyUsdForKey(key, inputs)
}

export function estimateAuthComparison(inputs: Pick<CalculatorInputs, 'mau'>) {
  const mau = inputs.mau
  const snapshot = competitorSnapshot

  // Supabase auth-only estimate: free if <= 50K, otherwise Pro base as baseline.
  const supabase = mau <= 50_000 ? 0 : 25

  return {
    mau,
    supabaseMonthlyUsd: supabase,
    auth0MonthlyUsd: estimateAuth0MonthlyUsd(mau),
    clerkMonthlyUsd: estimateClerkMonthlyUsd(mau),
    firebaseMonthlyUsd: estimateFirebaseAuthMonthlyUsd(mau) ?? 0,
    snapshot: {
      as_of: snapshot.as_of,
      providers: {
        auth0: {
          plan_name: snapshot.providers.auth0.plan_name,
          source_urls: snapshot.providers.auth0.source_urls,
          notes: snapshot.providers.auth0.notes,
        },
        clerk: {
          plan_name: snapshot.providers.clerk.plan_name,
          source_urls: snapshot.providers.clerk.source_urls,
          notes: snapshot.providers.clerk.notes,
        },
        firebase: {
          plan_name: snapshot.providers.firebase.plan_name,
          source_urls: snapshot.providers.firebase.source_urls,
          notes: snapshot.providers.firebase.notes,
        },
      },
    },
  }
}
