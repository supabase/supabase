import { supabasePricingModel } from 'shared-data'
import type { PricingCalculatorPlan } from 'shared-data'

import pricingAddOn from '~/data/PricingAddOnTable.json'
import type {
  CalculatorInputs,
  ComputeTier,
  FitStatus,
  PlanEstimate,
  PricingReport,
  UsageDimension,
} from './types'

const roundUsd = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

const parseUsd = (value: string) => {
  const normalized = value.replace('$', '').replaceAll(',', '').trim()
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

const getComputeTierPriceMap = (): Record<string, number> => {
  // `PricingAddOnTable.json` stores compute as rows with columns; we normalize into a map
  const rows = pricingAddOn.database?.rows ?? []
  const map: Record<string, number> = {}

  for (const row of rows) {
    const planCol = row.columns?.find((c: any) => c.key === 'plan')
    const priceCol = row.columns?.find((c: any) => c.key === 'pricing')
    if (!planCol || !priceCol) continue
    if (priceCol.value === 'Contact Us') continue
    map[String(planCol.value)] = parseUsd(String(priceCol.value))
  }

  return map
}

const COMPUTE_TIER_PRICE_MAP = getComputeTierPriceMap()

export function getComputeTierMonthlyUsd(tier: ComputeTier): number {
  return COMPUTE_TIER_PRICE_MAP[tier] ?? 0
}

function allFitOkOrOverage(fits: Record<UsageDimension, FitStatus>) {
  return !Object.values(fits).some((s) => s === 'unavailable' || s === 'limit_exceeded')
}

export function calculatePlanEstimate(
  inputs: CalculatorInputs,
  plan: PricingCalculatorPlan
): PlanEstimate {
  const planModel = supabasePricingModel.plans[plan]

  const fits: Record<UsageDimension, FitStatus> = {
    projects: 'ok',
    compute: 'ok',
    database_size: 'ok',
    storage_size: 'ok',
    egress: 'ok',
    mau: 'ok',
    sso: 'ok',
    phone_mfa: 'ok',
    realtime_peak_connections: 'ok',
    realtime_messages: 'ok',
    edge_invocations: 'ok',
    compliance: 'ok',
  }

  // Projects (Free plan limit)
  if (plan === 'free' && planModel.included.activeProjectsLimit) {
    fits.projects =
      inputs.projects <= planModel.included.activeProjectsLimit ? 'ok' : 'limit_exceeded'
  }

  // Compliance requirement (prototype: maps to Team/Enterprise signals)
  if (inputs.needCompliance) {
    fits.compliance = plan === 'team' ? 'ok' : 'unavailable'
  }

  // DB size (per project quota)
  const dbIncludedPerProject = planModel.included.databaseSizeGbPerProject
  if (plan === 'free') {
    fits.database_size = inputs.databaseSizeGb <= dbIncludedPerProject ? 'ok' : 'limit_exceeded'
  } else {
    fits.database_size = inputs.databaseSizeGb <= dbIncludedPerProject ? 'ok' : 'overage'
  }

  // Storage (org quota)
  if (plan === 'free') {
    fits.storage_size =
      inputs.storageSizeGb <= planModel.included.storageSizeGbPerOrg ? 'ok' : 'limit_exceeded'
  } else {
    fits.storage_size =
      inputs.storageSizeGb <= planModel.included.storageSizeGbPerOrg ? 'ok' : 'overage'
  }

  // Egress (org quota)
  if (plan === 'free') {
    fits.egress = inputs.egressGb <= planModel.included.egressGbPerOrg ? 'ok' : 'limit_exceeded'
  } else {
    fits.egress = inputs.egressGb <= planModel.included.egressGbPerOrg ? 'ok' : 'overage'
  }

  // MAU (org quota)
  if (plan === 'free') {
    fits.mau = inputs.mau <= planModel.included.mauPerOrg ? 'ok' : 'limit_exceeded'
  } else {
    fits.mau = inputs.mau <= planModel.included.mauPerOrg ? 'ok' : 'overage'
  }

  // SSO / SAML (end-user auth SSO)
  if (inputs.needSso) {
    if (!planModel.availability.sso) {
      fits.sso = 'unavailable'
    } else {
      const ssoMauAssumption = inputs.mau // prototype assumption: all MAUs are SSO users
      fits.sso = ssoMauAssumption <= planModel.included.ssoMauPerOrg ? 'ok' : 'overage'
    }
  }

  // Phone MFA add-on
  if (inputs.needPhoneMfa) {
    fits.phone_mfa = plan === 'free' ? 'unavailable' : 'ok'
  }

  // Realtime peak connections
  if (plan === 'free') {
    fits.realtime_peak_connections =
      inputs.realtimePeakConnections <= planModel.included.realtimePeakConnectionsPerOrg
        ? 'ok'
        : 'limit_exceeded'
  } else {
    fits.realtime_peak_connections =
      inputs.realtimePeakConnections <= planModel.included.realtimePeakConnectionsPerOrg
        ? 'ok'
        : 'overage'
  }

  // Realtime messages
  if (plan === 'free') {
    fits.realtime_messages =
      inputs.realtimeMessages <= planModel.included.realtimeMessagesPerOrg ? 'ok' : 'limit_exceeded'
  } else {
    fits.realtime_messages =
      inputs.realtimeMessages <= planModel.included.realtimeMessagesPerOrg ? 'ok' : 'overage'
  }

  // Edge invocations
  if (plan === 'free') {
    fits.edge_invocations =
      inputs.edgeInvocations <= planModel.included.edgeInvocationsPerOrg ? 'ok' : 'limit_exceeded'
  } else {
    fits.edge_invocations =
      inputs.edgeInvocations <= planModel.included.edgeInvocationsPerOrg ? 'ok' : 'overage'
  }

  const lineItems: PlanEstimate['lineItems'] = []

  // Base subscription
  lineItems.push({
    key: 'subscription',
    monthlyUsd: planModel.subscriptionMonthlyUsd,
  })

  // Compute (paid plans only)
  const computeTierMonthlyUsd = getComputeTierMonthlyUsd(inputs.computeTier)
  const computeMonthlyUsd = plan === 'free' ? 0 : roundUsd(inputs.projects * computeTierMonthlyUsd)
  if (plan !== 'free') {
    lineItems.push({
      key: 'compute',
      monthlyUsd: computeMonthlyUsd,
      details: [
        `${inputs.projects} project${inputs.projects === 1 ? '' : 's'} × $${roundUsd(computeTierMonthlyUsd)}/month`,
      ],
    })
  }

  // Compute credits (paid plans only)
  if (plan !== 'free') {
    const credit = supabasePricingModel.credits.computeCreditsMonthlyUsd
    const applied = Math.min(credit, computeMonthlyUsd)
    if (applied > 0) {
      lineItems.push({
        key: 'compute_credits',
        monthlyUsd: roundUsd(-applied),
        details: [`-$${roundUsd(applied)} compute credits applied`],
      })
    }
  }

  // DB size overage (paid plans only)
  if (plan !== 'free') {
    const included = planModel.included.databaseSizeGbPerProject
    const overGbPerProject = Math.max(0, inputs.databaseSizeGb - included)
    const overGbTotal = overGbPerProject * inputs.projects
    const cost = roundUsd(overGbTotal * planModel.overage.databaseSizeUsdPerGb)
    if (cost > 0) {
      lineItems.push({
        key: 'database_overage',
        monthlyUsd: cost,
        details: [
          `${roundUsd(overGbPerProject)} GB over per project × ${inputs.projects} projects`,
          `$${planModel.overage.databaseSizeUsdPerGb}/GB`,
        ],
      })
    }
  }

  // Storage overage
  if (plan !== 'free') {
    const overGb = Math.max(0, inputs.storageSizeGb - planModel.included.storageSizeGbPerOrg)
    const cost = roundUsd(overGb * planModel.overage.storageSizeUsdPerGb)
    if (cost > 0) {
      lineItems.push({
        key: 'storage_overage',
        monthlyUsd: cost,
        details: [`${roundUsd(overGb)} GB over`, `$${planModel.overage.storageSizeUsdPerGb}/GB`],
      })
    }
  }

  // Egress overage
  if (plan !== 'free') {
    const overGb = Math.max(0, inputs.egressGb - planModel.included.egressGbPerOrg)
    const cost = roundUsd(overGb * planModel.overage.egressUsdPerGb)
    if (cost > 0) {
      lineItems.push({
        key: 'egress_overage',
        monthlyUsd: cost,
        details: [`${roundUsd(overGb)} GB over`, `$${planModel.overage.egressUsdPerGb}/GB`],
      })
    }
  }

  // MAU overage
  if (plan !== 'free') {
    const over = Math.max(0, inputs.mau - planModel.included.mauPerOrg)
    const cost = roundUsd(over * planModel.overage.mauUsdPerMau)
    if (cost > 0) {
      lineItems.push({
        key: 'mau_overage',
        monthlyUsd: cost,
        details: [
          `${over.toLocaleString()} MAU over`,
          `$${planModel.overage.mauUsdPerMau} per MAU`,
        ],
      })
    }
  }

  // SSO MAU overage (if enabled)
  if (plan !== 'free' && inputs.needSso) {
    const ssoMauAssumption = inputs.mau
    const over = Math.max(0, ssoMauAssumption - planModel.included.ssoMauPerOrg)
    const cost = roundUsd(over * planModel.overage.ssoMauUsdPerMau)
    if (cost > 0) {
      lineItems.push({
        key: 'sso_overage',
        monthlyUsd: cost,
        details: [
          `${over.toLocaleString()} SSO MAU over`,
          `$${planModel.overage.ssoMauUsdPerMau} per SSO MAU`,
        ],
      })
    }
  }

  // Realtime peak connections overage
  if (plan !== 'free') {
    const over = Math.max(
      0,
      inputs.realtimePeakConnections - planModel.included.realtimePeakConnectionsPerOrg
    )
    const cost = roundUsd((over / 1000) * planModel.overage.realtimePeakConnectionsUsdPer1000)
    if (cost > 0) {
      lineItems.push({
        key: 'realtime_peak_connections_overage',
        monthlyUsd: cost,
        details: [
          `${over.toLocaleString()} over`,
          `$${planModel.overage.realtimePeakConnectionsUsdPer1000} per 1000`,
        ],
      })
    }
  }

  // Realtime messages overage
  if (plan !== 'free') {
    const over = Math.max(0, inputs.realtimeMessages - planModel.included.realtimeMessagesPerOrg)
    const cost = roundUsd((over / 1_000_000) * planModel.overage.realtimeMessagesUsdPerMillion)
    if (cost > 0) {
      lineItems.push({
        key: 'realtime_messages_overage',
        monthlyUsd: cost,
        details: [
          `${Math.round((over / 1_000_000) * 100) / 100} million over`,
          `$${planModel.overage.realtimeMessagesUsdPerMillion} per million`,
        ],
      })
    }
  }

  // Edge invocations overage
  if (plan !== 'free') {
    const over = Math.max(0, inputs.edgeInvocations - planModel.included.edgeInvocationsPerOrg)
    const cost = roundUsd((over / 1_000_000) * planModel.overage.edgeInvocationsUsdPerMillion)
    if (cost > 0) {
      lineItems.push({
        key: 'edge_invocations_overage',
        monthlyUsd: cost,
        details: [
          `${Math.round((over / 1_000_000) * 100) / 100} million over`,
          `$${planModel.overage.edgeInvocationsUsdPerMillion} per million`,
        ],
      })
    }
  }

  // Phone MFA add-on (if enabled)
  if (plan !== 'free' && inputs.needPhoneMfa) {
    const addon = supabasePricingModel.addons.phoneMfa
    const cost = roundUsd(
      addon.monthlyUsdFirstProject +
        Math.max(0, inputs.projects - 1) * addon.monthlyUsdPerAdditionalProject
    )
    if (cost > 0) {
      lineItems.push({
        key: 'phone_mfa_addon',
        monthlyUsd: cost,
        details: [
          `$${addon.monthlyUsdFirstProject} for first project`,
          `$${addon.monthlyUsdPerAdditionalProject} per additional project`,
        ],
      })
    }
  }

  const totalMonthlyUsd = roundUsd(lineItems.reduce((acc, item) => acc + item.monthlyUsd, 0))

  return {
    plan,
    totalMonthlyUsd: allFitOkOrOverage(fits) ? totalMonthlyUsd : totalMonthlyUsd,
    fits,
    lineItems,
  }
}

export function calculatePricingReport(inputs: CalculatorInputs): PricingReport {
  const estimates = {
    free: calculatePlanEstimate(inputs, 'free'),
    pro: calculatePlanEstimate(inputs, 'pro'),
    team: calculatePlanEstimate(inputs, 'team'),
  } satisfies Record<PricingCalculatorPlan, PlanEstimate>

  const candidates: PricingCalculatorPlan[] = (['free', 'pro', 'team'] as const).filter((p) =>
    allFitOkOrOverage(estimates[p].fits)
  )

  const recommendedPlan: PricingCalculatorPlan =
    candidates.length === 0
      ? 'team'
      : candidates.reduce((best, next) =>
          estimates[next].totalMonthlyUsd < estimates[best].totalMonthlyUsd ? next : best
        )

  const reasons: string[] = []
  if (recommendedPlan === 'free') {
    reasons.push('Your usage fits within Free plan limits.')
  }
  if (recommendedPlan === 'pro') {
    if (inputs.needSso) reasons.push('SSO/SAML requires a paid plan.')
    if (inputs.needPhoneMfa) reasons.push('Phone-based MFA is available on paid plans.')
    if (
      estimates.free.fits.egress !== 'ok' ||
      estimates.free.fits.mau !== 'ok' ||
      estimates.free.fits.storage_size !== 'ok' ||
      estimates.free.fits.database_size !== 'ok'
    ) {
      reasons.push('Your estimated usage exceeds Free plan limits.')
    }
    reasons.push('Pro plan is the lowest tier that supports your inputs.')
  }
  if (recommendedPlan === 'team') {
    if (inputs.needCompliance)
      reasons.push('Your compliance requirements require Team tier features.')
    reasons.push('Team plan is the lowest tier that supports your inputs.')
  }

  return {
    inputs,
    estimates,
    recommended: {
      plan: recommendedPlan,
      reasons,
    },
  }
}
