import { pricingCalculatorVersion } from 'shared-data'

import type {
  AppType,
  CalculatorInputs,
  ComputeTier,
  CurrentInfrastructure,
  ProjectionPeriodMonths,
  SelectedProduct,
} from './types'

const VALID_PRODUCTS: SelectedProduct[] = ['database', 'authentication', 'storage', 'functions', 'realtime', 'vector']

const VALID_APP_TYPES: AppType[] = ['content', 'ecommerce', 'saas', 'social', 'collaboration', 'realtime']

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

  if (inputs.timeAllocationOverrides?.auth != null)
    p.set('ta_auth', String(inputs.timeAllocationOverrides.auth))
  if (inputs.timeAllocationOverrides?.database != null)
    p.set('ta_db', String(inputs.timeAllocationOverrides.database))
  if (inputs.timeAllocationOverrides?.api != null)
    p.set('ta_api', String(inputs.timeAllocationOverrides.api))
  if (inputs.timeAllocationOverrides?.devops != null)
    p.set('ta_devops', String(inputs.timeAllocationOverrides.devops))

  return p
}

export function decodeInputsFromSearchParams(
  params: URLSearchParams,
  fallback: CalculatorInputs = getDefaultInputs()
): {
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
    currentInfrastructure:
      (params.get('infra') as CurrentInfrastructure) ?? fallback.currentInfrastructure,
    teamSize: clamp(Math.round(toNum(params.get('team'), fallback.teamSize)), 1, 500),
    hourlyCostUsd: clamp(toNum(params.get('hourly'), fallback.hourlyCostUsd), 0, 1000),
    needCompliance: toBool(params.get('compliance')),

    databaseSizeGb: clamp(toNum(params.get('db'), fallback.databaseSizeGb), 0.5, 10_000),
    storageSizeGb: clamp(toNum(params.get('storage'), fallback.storageSizeGb), 0, 100_000),
    egressGb: clamp(toNum(params.get('egress'), fallback.egressGb), 0, 100_000),
    mau: clamp(Math.round(toNum(params.get('mau'), fallback.mau)), 0, 50_000_000),
    needSso: toBool(params.get('sso')),
    needPhoneMfa: toBool(params.get('phone_mfa')),
    realtimePeakConnections: clamp(
      Math.round(toNum(params.get('rtc'), fallback.realtimePeakConnections)),
      0,
      10_000_000
    ),
    realtimeMessages: clamp(
      Math.round(toNum(params.get('rtm'), fallback.realtimeMessages)),
      0,
      10_000_000_000
    ),
    edgeInvocations: clamp(
      Math.round(toNum(params.get('edge'), fallback.edgeInvocations)),
      0,
      10_000_000_000
    ),
    computeTier: (params.get('compute') as ComputeTier) ?? fallback.computeTier,

    userGrowthRateMonthlyPct: clamp(
      toNum(params.get('growth'), fallback.userGrowthRateMonthlyPct),
      0,
      50
    ),
    dataGrowthGbPerMonth: clamp(
      toNum(params.get('data_growth'), fallback.dataGrowthGbPerMonth),
      0,
      100_000
    ),
    projectionMonths:
      (Math.round(
        toNum(params.get('months'), fallback.projectionMonths)
      ) as ProjectionPeriodMonths) ?? fallback.projectionMonths,
    // Note: we intentionally ignore any `compare` param in v1 multi-compare mode.

    timeAllocationOverrides: {
      auth: params.get('ta_auth')
        ? toNum(params.get('ta_auth'), fallback.timeAllocationOverrides?.auth ?? 0)
        : undefined,
      database: params.get('ta_db')
        ? toNum(params.get('ta_db'), fallback.timeAllocationOverrides?.database ?? 0)
        : undefined,
      api: params.get('ta_api')
        ? toNum(params.get('ta_api'), fallback.timeAllocationOverrides?.api ?? 0)
        : undefined,
      devops: params.get('ta_devops')
        ? toNum(params.get('ta_devops'), fallback.timeAllocationOverrides?.devops ?? 0)
        : undefined,
    },
  }

  return { inputs, versionMatch }
}

// --- Hash-based serialization (compact URL encoding) ---

// Short key mapping for compact URLs
const SHORT_KEYS: Record<string, string> = {
  v: 'v',
  products: 'p',
  projects: 'n',
  infra: 'i',
  team: 't',
  hourly: 'h',
  compliance: 'c',
  db: 'd',
  storage: 's',
  egress: 'e',
  mau: 'm',
  sso: 'o',
  phone_mfa: 'f',
  rtc: 'r',
  rtm: 'q',
  edge: 'x',
  compute: 'u',
  replicas: 'y',
  ipv4: '4',
  pitr: 'z',
  domain: 'w',
  logs: 'l',
  branch_hrs: 'b',
  growth: 'g',
  data_growth: 'a',
  months: 'j',
  app_type: 'k',
  ta_auth: 'A',
  ta_db: 'D',
  ta_api: 'P',
  ta_devops: 'V',
}

// Reverse mapping for decoding
const LONG_KEYS: Record<string, string> = Object.fromEntries(
  Object.entries(SHORT_KEYS).map(([long, short]) => [short, long])
)

function encodeBase64Url(str: string): string {
  // Use btoa for encoding, then convert to URL-safe base64
  const base64 = btoa(str)
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function decodeBase64Url(str: string): string {
  // Convert URL-safe base64 back to standard base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }
  return atob(base64)
}

export function encodeInputsToHash(inputs: CalculatorInputs): string {
  const defaults = getDefaultInputs()
  const pairs: string[] = []

  // Version
  pairs.push(`${SHORT_KEYS.v}=${pricingCalculatorVersion}`)

  // Only encode values that differ from defaults
  if (JSON.stringify(inputs.selectedProducts) !== JSON.stringify(defaults.selectedProducts)) {
    pairs.push(`${SHORT_KEYS.products}=${inputs.selectedProducts.join(',')}`)
  }
  if (inputs.projects !== defaults.projects) {
    pairs.push(`${SHORT_KEYS.projects}=${inputs.projects}`)
  }
  if (inputs.currentInfrastructure !== defaults.currentInfrastructure) {
    pairs.push(`${SHORT_KEYS.infra}=${inputs.currentInfrastructure}`)
  }
  if (inputs.teamSize !== defaults.teamSize) {
    pairs.push(`${SHORT_KEYS.team}=${inputs.teamSize}`)
  }
  if (inputs.hourlyCostUsd !== defaults.hourlyCostUsd) {
    pairs.push(`${SHORT_KEYS.hourly}=${inputs.hourlyCostUsd}`)
  }
  if (inputs.needCompliance !== defaults.needCompliance) {
    pairs.push(`${SHORT_KEYS.compliance}=1`)
  }
  if (inputs.databaseSizeGb !== defaults.databaseSizeGb) {
    pairs.push(`${SHORT_KEYS.db}=${inputs.databaseSizeGb}`)
  }
  if (inputs.storageSizeGb !== defaults.storageSizeGb) {
    pairs.push(`${SHORT_KEYS.storage}=${inputs.storageSizeGb}`)
  }
  if (inputs.egressGb !== defaults.egressGb) {
    pairs.push(`${SHORT_KEYS.egress}=${inputs.egressGb}`)
  }
  if (inputs.mau !== defaults.mau) {
    pairs.push(`${SHORT_KEYS.mau}=${inputs.mau}`)
  }
  if (inputs.needSso !== defaults.needSso) {
    pairs.push(`${SHORT_KEYS.sso}=1`)
  }
  if (inputs.needPhoneMfa !== defaults.needPhoneMfa) {
    pairs.push(`${SHORT_KEYS.phone_mfa}=1`)
  }
  if (inputs.realtimePeakConnections !== defaults.realtimePeakConnections) {
    pairs.push(`${SHORT_KEYS.rtc}=${inputs.realtimePeakConnections}`)
  }
  if (inputs.realtimeMessages !== defaults.realtimeMessages) {
    pairs.push(`${SHORT_KEYS.rtm}=${inputs.realtimeMessages}`)
  }
  if (inputs.edgeInvocations !== defaults.edgeInvocations) {
    pairs.push(`${SHORT_KEYS.edge}=${inputs.edgeInvocations}`)
  }
  if (inputs.computeTier !== defaults.computeTier) {
    pairs.push(`${SHORT_KEYS.compute}=${inputs.computeTier}`)
  }
  if (inputs.readReplicas > 0) {
    pairs.push(`${SHORT_KEYS.replicas}=${inputs.readReplicas}`)
  }
  if (inputs.ipv4) {
    pairs.push(`${SHORT_KEYS.ipv4}=1`)
  }
  if (inputs.pitr) {
    pairs.push(`${SHORT_KEYS.pitr}=1`)
  }
  if (inputs.customDomain) {
    pairs.push(`${SHORT_KEYS.domain}=1`)
  }
  if (inputs.logDrains > 0) {
    pairs.push(`${SHORT_KEYS.logs}=${inputs.logDrains}`)
  }
  if (inputs.branchingHoursPerMonth > 0) {
    pairs.push(`${SHORT_KEYS.branch_hrs}=${inputs.branchingHoursPerMonth}`)
  }
  if (inputs.userGrowthRateMonthlyPct !== defaults.userGrowthRateMonthlyPct) {
    pairs.push(`${SHORT_KEYS.growth}=${inputs.userGrowthRateMonthlyPct}`)
  }
  if (inputs.dataGrowthGbPerMonth !== defaults.dataGrowthGbPerMonth) {
    pairs.push(`${SHORT_KEYS.data_growth}=${inputs.dataGrowthGbPerMonth}`)
  }
  if (inputs.projectionMonths !== defaults.projectionMonths) {
    pairs.push(`${SHORT_KEYS.months}=${inputs.projectionMonths}`)
  }
  if (inputs.appType !== defaults.appType) {
    pairs.push(`${SHORT_KEYS.app_type}=${inputs.appType}`)
  }
  if (inputs.timeAllocationOverrides?.auth != null) {
    pairs.push(`${SHORT_KEYS.ta_auth}=${inputs.timeAllocationOverrides.auth}`)
  }
  if (inputs.timeAllocationOverrides?.database != null) {
    pairs.push(`${SHORT_KEYS.ta_db}=${inputs.timeAllocationOverrides.database}`)
  }
  if (inputs.timeAllocationOverrides?.api != null) {
    pairs.push(`${SHORT_KEYS.ta_api}=${inputs.timeAllocationOverrides.api}`)
  }
  if (inputs.timeAllocationOverrides?.devops != null) {
    pairs.push(`${SHORT_KEYS.ta_devops}=${inputs.timeAllocationOverrides.devops}`)
  }

  // Join with & and base64url encode
  const queryString = pairs.join('&')
  return encodeBase64Url(queryString)
}

export function decodeInputsFromHash(
  hash: string,
  fallback: CalculatorInputs = getDefaultInputs()
): {
  inputs: CalculatorInputs
  versionMatch: boolean
} {
  try {
    const decoded = decodeBase64Url(hash)
    const params: Record<string, string> = {}

    // Parse the short-key query string
    for (const pair of decoded.split('&')) {
      const [shortKey, value] = pair.split('=')
      const longKey = LONG_KEYS[shortKey] || shortKey
      params[longKey] = value
    }

    const v = params.v
    const versionMatch = !v || v === pricingCalculatorVersion

    // Parse selected products
    const productsParam = params.products
    const selectedProducts: SelectedProduct[] = productsParam
      ? productsParam
          .split(',')
          .filter((p): p is SelectedProduct => VALID_PRODUCTS.includes(p as SelectedProduct))
      : fallback.selectedProducts

    // Parse app type
    const appTypeParam = params.app_type
    const appType: AppType =
      appTypeParam && VALID_APP_TYPES.includes(appTypeParam as AppType)
        ? (appTypeParam as AppType)
        : fallback.appType

    const inputs: CalculatorInputs = {
      ...fallback,
      selectedProducts,
      projects: params.projects
        ? clamp(Math.round(toNum(params.projects, fallback.projects)), 1, 50)
        : fallback.projects,
      currentInfrastructure: (params.infra as CurrentInfrastructure) ?? fallback.currentInfrastructure,
      teamSize: params.team
        ? clamp(Math.round(toNum(params.team, fallback.teamSize)), 1, 500)
        : fallback.teamSize,
      hourlyCostUsd: params.hourly
        ? clamp(toNum(params.hourly, fallback.hourlyCostUsd), 0, 1000)
        : fallback.hourlyCostUsd,
      needCompliance: toBool(params.compliance || null),
      databaseSizeGb: params.db
        ? clamp(toNum(params.db, fallback.databaseSizeGb), 0.5, 10_000)
        : fallback.databaseSizeGb,
      storageSizeGb: params.storage
        ? clamp(toNum(params.storage, fallback.storageSizeGb), 0, 100_000)
        : fallback.storageSizeGb,
      egressGb: params.egress
        ? clamp(toNum(params.egress, fallback.egressGb), 0, 100_000)
        : fallback.egressGb,
      mau: params.mau
        ? clamp(Math.round(toNum(params.mau, fallback.mau)), 0, 50_000_000)
        : fallback.mau,
      needSso: toBool(params.sso || null),
      needPhoneMfa: toBool(params.phone_mfa || null),
      realtimePeakConnections: params.rtc
        ? clamp(Math.round(toNum(params.rtc, fallback.realtimePeakConnections)), 0, 10_000_000)
        : fallback.realtimePeakConnections,
      realtimeMessages: params.rtm
        ? clamp(Math.round(toNum(params.rtm, fallback.realtimeMessages)), 0, 10_000_000_000)
        : fallback.realtimeMessages,
      edgeInvocations: params.edge
        ? clamp(Math.round(toNum(params.edge, fallback.edgeInvocations)), 0, 10_000_000_000)
        : fallback.edgeInvocations,
      computeTier: (params.compute as ComputeTier) ?? fallback.computeTier,
      readReplicas: params.replicas
        ? clamp(Math.round(toNum(params.replicas, 0)), 0, 10)
        : fallback.readReplicas,
      ipv4: toBool(params.ipv4 || null),
      pitr: toBool(params.pitr || null),
      customDomain: toBool(params.domain || null),
      logDrains: params.logs ? clamp(Math.round(toNum(params.logs, 0)), 0, 10) : fallback.logDrains,
      branchingHoursPerMonth: params.branch_hrs
        ? clamp(Math.round(toNum(params.branch_hrs, 0)), 0, 10000)
        : fallback.branchingHoursPerMonth,
      userGrowthRateMonthlyPct: params.growth
        ? clamp(toNum(params.growth, fallback.userGrowthRateMonthlyPct), 0, 50)
        : fallback.userGrowthRateMonthlyPct,
      dataGrowthGbPerMonth: params.data_growth
        ? clamp(toNum(params.data_growth, fallback.dataGrowthGbPerMonth), 0, 100_000)
        : fallback.dataGrowthGbPerMonth,
      projectionMonths: params.months
        ? (Math.round(toNum(params.months, fallback.projectionMonths)) as ProjectionPeriodMonths)
        : fallback.projectionMonths,
      appType,
      timeAllocationOverrides: {
        auth: params.ta_auth ? toNum(params.ta_auth, 0) : undefined,
        database: params.ta_db ? toNum(params.ta_db, 0) : undefined,
        api: params.ta_api ? toNum(params.ta_api, 0) : undefined,
        devops: params.ta_devops ? toNum(params.ta_devops, 0) : undefined,
      },
    }

    return { inputs, versionMatch }
  } catch {
    // If decoding fails, return defaults
    return { inputs: fallback, versionMatch: false }
  }
}
