import type { CalculatorInputs, RoiSummary, TimeAllocation } from './types'

const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100

const REDUCTION_PCT = {
  auth: 0.85,
  database: 0.65,
  api: 0.75,
  devops: 0.85,
} as const

export function getDefaultTimeAllocation(teamSize: number): TimeAllocation {
  return {
    auth: teamSize * 3,
    database: teamSize * 5,
    api: teamSize * 8,
    devops: teamSize * 4,
  }
}

export function calculateRoiSummary(
  inputs: Pick<CalculatorInputs, 'teamSize' | 'hourlyCostUsd' | 'timeAllocationOverrides'>
): RoiSummary {
  const defaults = getDefaultTimeAllocation(inputs.teamSize)
  const merged: TimeAllocation = {
    auth: inputs.timeAllocationOverrides?.auth ?? defaults.auth,
    database: inputs.timeAllocationOverrides?.database ?? defaults.database,
    api: inputs.timeAllocationOverrides?.api ?? defaults.api,
    devops: inputs.timeAllocationOverrides?.devops ?? defaults.devops,
  }

  const breakdown = {
    auth: {
      hoursBefore: merged.auth,
      hoursRecovered: merged.auth * REDUCTION_PCT.auth,
      reductionPct: REDUCTION_PCT.auth,
    },
    database: {
      hoursBefore: merged.database,
      hoursRecovered: merged.database * REDUCTION_PCT.database,
      reductionPct: REDUCTION_PCT.database,
    },
    api: {
      hoursBefore: merged.api,
      hoursRecovered: merged.api * REDUCTION_PCT.api,
      reductionPct: REDUCTION_PCT.api,
    },
    devops: {
      hoursBefore: merged.devops,
      hoursRecovered: merged.devops * REDUCTION_PCT.devops,
      reductionPct: REDUCTION_PCT.devops,
    },
  } as const

  const hoursRecoveredPerMonth =
    breakdown.auth.hoursRecovered +
    breakdown.database.hoursRecovered +
    breakdown.api.hoursRecovered +
    breakdown.devops.hoursRecovered

  const valueRecoveredPerMonthUsd = hoursRecoveredPerMonth * inputs.hourlyCostUsd

  return {
    hoursRecoveredPerMonth: round2(hoursRecoveredPerMonth),
    hoursRecoveredPerYear: round2(hoursRecoveredPerMonth * 12),
    valueRecoveredPerMonthUsd: round2(valueRecoveredPerMonthUsd),
    valueRecoveredPerYearUsd: round2(valueRecoveredPerMonthUsd * 12),
    breakdown: {
      auth: breakdown.auth,
      database: breakdown.database,
      api: breakdown.api,
      devops: breakdown.devops,
    },
  }
}
