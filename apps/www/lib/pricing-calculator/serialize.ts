import { pricingCalculatorVersion } from 'shared-data'

import type { CalculatorInputs, ComputeTier, CurrentInfrastructure, ProjectionPeriodMonths } from './types'

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const toBool = (v: string | null) => v === '1' || v === 'true'
const toNum = (v: string | null, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export function getDefaultInputs(): CalculatorInputs {
  return {
    selectedProducts: ['database', 'authentication'],

    projects: 1,
    currentInfrastructure: 'starting_fresh',
    teamSize: 2,
    hourlyCostUsd: 150,
    needCompliance: false,

    databaseSizeGb: 2,
    storageSizeGb: 10,
    egressGb: 50,
    mau: 10_000,
    needSso: false,
    needPhoneMfa: false,
    realtimePeakConnections: 100,
    realtimeMessages: 1_000_000,
    edgeInvocations: 500_000,
    computeTier: 'Micro',

    // Add-ons (defaults to disabled/zero)
    readReplicas: 0,
    ipv4: false,
    pitr: false,
    customDomain: false,
    logDrains: 0,
    branchingHoursPerMonth: 0,

    userGrowthRateMonthlyPct: 10,
    dataGrowthGbPerMonth: 1,
    projectionMonths: 12,
    appType: 'saas',

    timeAllocationOverrides: {},
  }
}

export function encodeInputsToSearchParams(inputs: CalculatorInputs): URLSearchParams {
  const p = new URLSearchParams()
  p.set('v', pricingCalculatorVersion)

  // Selected products (comma-separated)
  if (inputs.selectedProducts.length > 0) {
    p.set('products', inputs.selectedProducts.join(','))
  }

  p.set('projects', String(inputs.projects))
  p.set('infra', inputs.currentInfrastructure)
  p.set('team', String(inputs.teamSize))
  p.set('hourly', String(inputs.hourlyCostUsd))
  p.set('compliance', inputs.needCompliance ? '1' : '0')

  p.set('db', String(inputs.databaseSizeGb))
  p.set('storage', String(inputs.storageSizeGb))
  p.set('egress', String(inputs.egressGb))
  p.set('mau', String(inputs.mau))
  p.set('sso', inputs.needSso ? '1' : '0')
  p.set('phone_mfa', inputs.needPhoneMfa ? '1' : '0')
  p.set('rtc', String(inputs.realtimePeakConnections))
  p.set('rtm', String(inputs.realtimeMessages))
  p.set('edge', String(inputs.edgeInvocations))
  p.set('compute', inputs.computeTier)

  // Add-ons (only encode non-default values)
  if (inputs.readReplicas > 0) p.set('replicas', String(inputs.readReplicas))
  if (inputs.ipv4) p.set('ipv4', '1')
  if (inputs.pitr) p.set('pitr', '1')
  if (inputs.customDomain) p.set('domain', '1')
  if (inputs.logDrains > 0) p.set('logs', String(inputs.logDrains))
  if (inputs.branchingHoursPerMonth > 0) p.set('branch_hrs', String(inputs.branchingHoursPerMonth))

  p.set('growth', String(inputs.userGrowthRateMonthlyPct))
  p.set('data_growth', String(inputs.dataGrowthGbPerMonth))
  p.set('months', String(inputs.projectionMonths))
  p.set('app_type', inputs.appType)

  if (inputs.timeAllocationOverrides?.auth != null) p.set('ta_auth', String(inputs.timeAllocationOverrides.auth))
  if (inputs.timeAllocationOverrides?.database != null)
    p.set('ta_db', String(inputs.timeAllocationOverrides.database))
  if (inputs.timeAllocationOverrides?.api != null) p.set('ta_api', String(inputs.timeAllocationOverrides.api))
  if (inputs.timeAllocationOverrides?.devops != null) p.set('ta_devops', String(inputs.timeAllocationOverrides.devops))

  return p
}

export function decodeInputsFromSearchParams(params: URLSearchParams, fallback: CalculatorInputs = getDefaultInputs()): {
  inputs: CalculatorInputs
  versionMatch: boolean
} {
  const v = params.get('v')
  const versionMatch = !v || v === pricingCalculatorVersion

  // Parse selected products
  const productsParam = params.get('products')
  const selectedProducts: SelectedProduct[] = productsParam
    ? productsParam.split(',').filter((p): p is SelectedProduct => VALID_PRODUCTS.includes(p as SelectedProduct))
    : fallback.selectedProducts

  const inputs: CalculatorInputs = {
    ...fallback,
    selectedProducts,
    projects: clamp(Math.round(toNum(params.get('projects'), fallback.projects)), 1, 50),
    currentInfrastructure: (params.get('infra') as CurrentInfrastructure) ?? fallback.currentInfrastructure,
    teamSize: clamp(Math.round(toNum(params.get('team'), fallback.teamSize)), 1, 500),
    hourlyCostUsd: clamp(toNum(params.get('hourly'), fallback.hourlyCostUsd), 0, 1000),
    needCompliance: toBool(params.get('compliance')),

    databaseSizeGb: clamp(toNum(params.get('db'), fallback.databaseSizeGb), 0.5, 10_000),
    storageSizeGb: clamp(toNum(params.get('storage'), fallback.storageSizeGb), 0, 100_000),
    egressGb: clamp(toNum(params.get('egress'), fallback.egressGb), 0, 100_000),
    mau: clamp(Math.round(toNum(params.get('mau'), fallback.mau)), 0, 50_000_000),
    needSso: toBool(params.get('sso')),
    needPhoneMfa: toBool(params.get('phone_mfa')),
    realtimePeakConnections: clamp(Math.round(toNum(params.get('rtc'), fallback.realtimePeakConnections)), 0, 10_000_000),
    realtimeMessages: clamp(Math.round(toNum(params.get('rtm'), fallback.realtimeMessages)), 0, 10_000_000_000),
    edgeInvocations: clamp(Math.round(toNum(params.get('edge'), fallback.edgeInvocations)), 0, 10_000_000_000),
    computeTier: (params.get('compute') as ComputeTier) ?? fallback.computeTier,

    userGrowthRateMonthlyPct: clamp(toNum(params.get('growth'), fallback.userGrowthRateMonthlyPct), 0, 50),
    dataGrowthGbPerMonth: clamp(toNum(params.get('data_growth'), fallback.dataGrowthGbPerMonth), 0, 100_000),
    projectionMonths: (Math.round(toNum(params.get('months'), fallback.projectionMonths)) as ProjectionPeriodMonths) ?? fallback.projectionMonths,
    // Note: we intentionally ignore any `compare` param in v1 multi-compare mode.

    timeAllocationOverrides: {
      auth: params.get('ta_auth') ? toNum(params.get('ta_auth'), fallback.timeAllocationOverrides?.auth ?? 0) : undefined,
      database: params.get('ta_db') ? toNum(params.get('ta_db'), fallback.timeAllocationOverrides?.database ?? 0) : undefined,
      api: params.get('ta_api') ? toNum(params.get('ta_api'), fallback.timeAllocationOverrides?.api ?? 0) : undefined,
      devops: params.get('ta_devops') ? toNum(params.get('ta_devops'), fallback.timeAllocationOverrides?.devops ?? 0) : undefined,
    },
  }

  return { inputs, versionMatch }
}

