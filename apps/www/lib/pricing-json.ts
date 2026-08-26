import { plans } from 'shared-data/plans'
import { ADDONS, DISK_PRICING, METERS, PLAN_BILLING, usd } from 'shared-data/pricing-catalog'

import addOnTable from '@/data/PricingAddOnTable.json'

export function getColumnValue(
  row: { columns: { key: string; value: unknown }[] },
  key: string
): unknown {
  const col = row.columns.find((c) => c.key === key)
  if (!col) throw new Error(`Missing column "${key}"`)
  return col.value
}

export function parseUsdString(value: string): number {
  const match = /^\$([\d,]+(?:\.\d+)?)$/.exec(value)
  if (!match) throw new Error(`Unparseable price: ${value}`)
  return Number(match[1].replace(/,/g, ''))
}

function parseGbString(value: string): number {
  const match = /^([\d.]+)[  ]GB$/.exec(value)
  if (!match) throw new Error(`Unparseable size: ${value}`)
  return Number(match[1])
}

function parseCountString(value: string): number {
  const match = /^[\d,]+$/.exec(value)
  if (!match) throw new Error(`Unparseable count: ${value}`)
  return Number(value.replace(/,/g, ''))
}

interface ComputeTier {
  name: string
  priceMonthly: number | null
  contactSales?: true
  cpu?: string
  dedicated?: boolean
  memoryGb?: number
  connectionsDirect?: number
  connectionsPooler?: number
}

function buildComputeTiers(): ComputeTier[] {
  return addOnTable.database.rows.map((row) => {
    const name = String(getColumnValue(row, 'plan'))
    const pricing = String(getColumnValue(row, 'pricing'))

    if (pricing === 'Contact Us') {
      return { name, priceMonthly: null, contactSales: true as const }
    }

    return {
      name,
      priceMonthly: parseUsdString(pricing),
      cpu: String(getColumnValue(row, 'cpu')),
      dedicated: Boolean(getColumnValue(row, 'dedicated')),
      memoryGb: parseGbString(String(getColumnValue(row, 'memory'))),
      connectionsDirect: parseCountString(String(getColumnValue(row, 'directConnections'))),
      connectionsPooler: parseCountString(String(getColumnValue(row, 'poolerConnections'))),
    }
  })
}

export function buildPricingJson() {
  return {
    description:
      'Machine-readable pricing for https://supabase.com/pricing. Informational, not a billing API. Monthly totals depend on plan quotas, compute credits, and the spend cap encoded below; metered prices apply only beyond includedByPlan quotas.',
    source: 'https://supabase.com/pricing',
    docs: 'https://supabase.com/docs/guides/platform/org-based-billing',
    currency: 'USD',
    plans: plans.map((plan) => {
      const billing = PLAN_BILLING[plan.planId]
      return {
        id: plan.planId,
        name: plan.name,
        priceMonthly: billing.priceMonthly,
        ...(plan.planId === 'enterprise' ? { contactSales: true as const } : {}),
        computeCreditsMonthly: billing.computeCreditsMonthly,
        spendCapAvailable: billing.spendCapAvailable,
      }
    }),
    compute: {
      scope: 'per-project',
      note: `Every project runs on its own compute instance, billed hourly. Pro and Team plans include ${usd(PLAN_BILLING.pro.computeCreditsMonthly)}/month in compute credits, which covers one Micro instance.`,
      tiers: buildComputeTiers(),
    },
    disk: {
      scope: 'per-project',
      types: Object.entries(DISK_PRICING).map(([type, disk]) => ({
        type,
        name: disk.displayName,
        maxSizeTb: disk.maxSizeTb,
        durabilityPercent: disk.durabilityPercent,
        includedPerProject: disk.includedPerProject,
        perUnitMonth: disk.perUnitMonth,
        ...(disk.throughputNote ? { throughputNote: disk.throughputNote } : {}),
      })),
    },
    meters: Object.entries(METERS).map(([id, meter]) => ({
      id,
      product: meter.product,
      ...('unified' in meter && meter.unified ? { unified: true as const } : {}),
      scope: `per-${meter.scope}`,
      unit: meter.unit,
      unitQuantity: meter.per,
      pricePerUnitQuantity: meter.price,
      includedByPlan: meter.includedByPlan,
      ...('billingNote' in meter && meter.billingNote ? { billingNote: meter.billingNote } : {}),
    })),
    addons: Object.entries(ADDONS).map(([id, addon]) => {
      const { scope, availability, ...prices } = addon
      return { id, scope: `per-${scope}`, ...prices, availability }
    }),
  }
}

export type PricingJson = ReturnType<typeof buildPricingJson>
