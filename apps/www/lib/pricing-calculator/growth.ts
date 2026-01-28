import type { CalculatorInputs, ComparisonPlatform, ProjectionSeries } from './types'
import { calculatePricingReport } from './supabase'
import { estimateCompetitorMonthlyUsdForKey } from './competitors'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

function compound(value: number, pct: number, periods: number) {
  return value * Math.pow(1 + pct / 100, periods)
}

export function buildProjectionSeries(inputs: CalculatorInputs): ProjectionSeries {
  const platforms: ComparisonPlatform[] = [
    'firebase',
    'self_hosted',
    'auth0',
    'clerk',
    'convex',
    'aws',
  ]

  const points = Array.from({ length: inputs.projectionMonths }, (_, idx) => {
    const mau = Math.round(compound(inputs.mau, inputs.userGrowthRateMonthlyPct, idx))

    // Prototype assumption: data growth is split between DB and Storage.
    const dbGrowthShare = 0.6
    const storageGrowthShare = 0.4
    const dataGrowthTotal = inputs.dataGrowthGbPerMonth * idx

    const databaseSizeGb = round2(inputs.databaseSizeGb + dataGrowthTotal * dbGrowthShare)
    const storageSizeGb = round2(inputs.storageSizeGb + dataGrowthTotal * storageGrowthShare)

    // Prototype assumption: egress scales proportionally with MAU
    const egressGb = round2((inputs.egressGb * mau) / Math.max(1, inputs.mau))

    const monthInputs: CalculatorInputs = {
      ...inputs,
      mau,
      databaseSizeGb,
      storageSizeGb,
      egressGb,
    }

    const report = calculatePricingReport(monthInputs)
    const supabaseMonthlyUsd = report.estimates[report.recommended.plan].totalMonthlyUsd
    const competitorsMonthlyUsd = platforms.reduce(
      (acc, key) => {
        acc[key] = estimateCompetitorMonthlyUsdForKey(key, monthInputs).monthlyUsd
        return acc
      },
      {} as Record<ComparisonPlatform, number>
    )

    return {
      monthIndex: idx + 1,
      mau,
      databaseSizeGb,
      storageSizeGb,
      egressGb,
      supabaseMonthlyUsd,
      competitorsMonthlyUsd,
    }
  })

  const cumulativeSupabase = round2(points.reduce((acc, p) => acc + p.supabaseMonthlyUsd, 0))
  const cumulativeCompetitorsUsd = platforms.reduce(
    (acc, key) => {
      acc[key] = round2(points.reduce((sum, p) => sum + p.competitorsMonthlyUsd[key], 0))
      return acc
    },
    {} as Record<ComparisonPlatform, number>
  )
  const savingsUsd = platforms.reduce(
    (acc, key) => {
      acc[key] = round2(cumulativeCompetitorsUsd[key] - cumulativeSupabase)
      return acc
    },
    {} as Record<ComparisonPlatform, number>
  )

  return {
    months: inputs.projectionMonths,
    points,
    cumulative: {
      supabaseUsd: cumulativeSupabase,
      competitorsUsd: cumulativeCompetitorsUsd,
      savingsUsd,
    },
  }
}
