import { plans } from 'shared-data/plans'
import { pricing } from 'shared-data/pricing'
import { DISK_PRICING, PLAN_BILLING, qty, usd } from 'shared-data/pricing-catalog'

import addOnTable from '@/data/PricingAddOnTable.json'
import pricingFaq from '@/data/PricingFAQ.json'
import { getColumnValue, parseUsdString } from '@/lib/pricing-json'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type PlanId = 'free' | 'pro' | 'team' | 'enterprise'

const PLAN_IDS: PlanId[] = ['free', 'pro', 'team', 'enterprise']
const PLAN_LABELS: Record<PlanId, string> = {
  free: 'Free',
  pro: 'Pro',
  team: 'Team',
  enterprise: 'Enterprise',
}

function formatPlanValue(val: boolean | string | string[]): string {
  if (val === true) return 'Included'
  if (val === false) return 'Not included'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

function pad(str: string, len: number): string {
  return str.padEnd(len)
}

function buildMarkdownTable(headers: string[], dataRows: string[][]): string[] {
  const widths = headers.map((h, i) => Math.max(h.length, ...dataRows.map((r) => r[i].length)))
  const headerRow = `| ${headers.map((h, i) => pad(h, widths[i])).join(' | ')} |`
  const separator = `| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`
  const bodyRows = dataRows.map(
    (cells) => `| ${cells.map((c, i) => pad(c, widths[i])).join(' | ')} |`
  )
  return [headerRow, separator, ...bodyRows]
}

// ---------------------------------------------------------------------------
// Plan Tiers
// ---------------------------------------------------------------------------

function buildPlanTiersSection(): string {
  const lines: string[] = ['## Plan Tiers', '']

  for (const plan of plans) {
    if (plan.planId === 'enterprise') {
      lines.push(`### ${plan.name} - custom pricing`)
    } else {
      lines.push(`### ${plan.name} - from $${plan.priceMonthly}/month`)
    }

    for (const feature of plan.features) {
      if (Array.isArray(feature)) {
        lines.push(`- ${feature[0]}` + (feature[1] ? ` (${feature[1]})` : ''))
      } else {
        lines.push(`- ${feature}`)
      }
    }

    if (plan.footer) {
      lines.push(`- Note: ${plan.footer}`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Compute Add-Ons
// ---------------------------------------------------------------------------

function buildComputeSection(): string {
  const rows = addOnTable.database.rows

  const headers = [
    'Size',
    '$/month',
    'CPU',
    'Dedicated',
    'RAM',
    'Direct Connections',
    'Pooler Connections',
  ]
  const keys = [
    'plan',
    'pricing',
    'cpu',
    'dedicated',
    'memory',
    'directConnections',
    'poolerConnections',
  ]

  const dataRows = rows.map((row) =>
    keys.map((key) => {
      const val = getColumnValue(row, key)
      if (key === 'dedicated') return val ? 'Yes' : 'No'
      return String(val)
    })
  )

  return [
    '## Compute Add-Ons',
    '',
    'All projects run on a compute instance. Pro and Team plans include Micro compute in the base price.',
    '',
    ...buildMarkdownTable(headers, dataRows),
    '',
    `Compute is billed hourly. Each project runs its own instance. Pro and Team plans include ${usd(PLAN_BILLING.pro.computeCreditsMonthly)}/month in compute credits (covers one Micro instance). Additional projects add their full compute cost.`,
    '',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Disk Storage
// ---------------------------------------------------------------------------

function buildDiskSection(): string {
  const headers = ['Disk type', 'Max size', 'Size', 'IOPS', 'Throughput', 'Durability']

  const dataRows = Object.entries(DISK_PRICING).map(([type, disk]) => {
    const size = disk.includedPerProject
      ? `${disk.includedPerProject.sizeGb} GB included, then ${usd(disk.perUnitMonth.sizeGb)} per GB`
      : `${usd(disk.perUnitMonth.sizeGb)} per GB`
    const iops = disk.includedPerProject
      ? `${qty(disk.includedPerProject.iops, 'comma')} IOPS included, then ${usd(disk.perUnitMonth.iops)} per IOPS`
      : `${usd(disk.perUnitMonth.iops)} per IOPS`
    const throughput =
      disk.includedPerProject && disk.perUnitMonth.throughputMBps !== null
        ? `${qty(disk.includedPerProject.throughputMBps)} MB/s included, then ${usd(disk.perUnitMonth.throughputMBps)} per MB/s`
        : (disk.throughputNote ?? '')

    return [
      `${disk.displayName} (${type})`,
      `${disk.maxSizeTb} TB`,
      size,
      iops,
      throughput,
      `${disk.durabilityPercent}%`,
    ]
  })

  return ['## Disk Storage', '', ...buildMarkdownTable(headers, dataRows), ''].join('\n')
}

// ---------------------------------------------------------------------------
// Add-Ons
// ---------------------------------------------------------------------------

function findFeature(categoryKey: string, featureKey: string) {
  const category = pricing[categoryKey as keyof typeof pricing]
  const feature = category.features.find((f) => f.key === featureKey)
  if (!feature) throw new Error(`Missing pricing feature "${featureKey}" in "${categoryKey}"`)
  return feature
}

function buildAddOnsSection(): string {
  const addOns = [
    [
      'Point-in-Time Recovery (PITR)',
      formatPlanValue(findFeature('database', 'database.pitr').plans.pro),
    ],
    ['Custom Domain', formatPlanValue(findFeature('security', 'security.customDomains').plans.pro)],
    [
      'Database Branching',
      formatPlanValue(findFeature('database', 'database.branching').plans.pro),
    ],
    [
      'Advanced MFA (Phone)',
      formatPlanValue(findFeature('auth', 'auth.advancedMFAPhone').plans.pro),
    ],
    ['SAML/SSO Auth', formatPlanValue(findFeature('auth', 'auth.saml').plans.pro)],
    ['Log Drains', formatPlanValue(findFeature('security', 'security.logDrain').plans.pro)],
    [
      'Image Transformations',
      formatPlanValue(findFeature('storage', 'storage.transformations').plans.pro),
    ],
  ]

  return ['## Add-Ons', '', ...buildMarkdownTable(['Add-on', 'Price'], addOns), ''].join('\n')
}

// ---------------------------------------------------------------------------
// Full Feature Comparison
// ---------------------------------------------------------------------------

function buildFeatureComparisonSection(): string {
  const lines: string[] = ['## Full Feature Comparison', '']

  for (const [, category] of Object.entries(pricing)) {
    lines.push(`### ${category.title}`, '')

    const nameWidth = Math.max('Feature'.length, ...category.features.map((f) => f.title.length))
    const planWidths = Object.fromEntries(
      PLAN_IDS.map((id) => [
        id,
        Math.max(
          PLAN_LABELS[id].length,
          ...category.features.map((f) => formatPlanValue(f.plans[id]).length)
        ),
      ])
    )

    const headerRow = `| ${pad('Feature', nameWidth)} | ${PLAN_IDS.map((p) => pad(PLAN_LABELS[p], planWidths[p])).join(' | ')} |`
    const separatorRow = `| ${'-'.repeat(nameWidth)} | ${PLAN_IDS.map((p) => '-'.repeat(planWidths[p])).join(' | ')} |`

    lines.push(headerRow, separatorRow)

    for (const feature of category.features) {
      const cells = PLAN_IDS.map((p) => pad(formatPlanValue(feature.plans[p]), planWidths[p]))
      lines.push(`| ${pad(feature.title, nameWidth)} | ${cells.join(' | ')} |`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// FAQ
// ---------------------------------------------------------------------------

function buildFAQSection(): string {
  const lines: string[] = ['## Frequently Asked Questions', '']

  for (const { question, answer } of pricingFaq) {
    lines.push(`### ${question}`, '', answer, '')
  }

  return lines.join('\n')
}

function buildBillingExample(): string {
  const proPrice = PLAN_BILLING.pro.priceMonthly
  const credits = PLAN_BILLING.pro.computeCreditsMonthly
  const microRow = addOnTable.database.rows.find((row) => getColumnValue(row, 'plan') === 'Micro')
  if (!microRow) throw new Error('Missing Micro row in PricingAddOnTable')
  const microPrice = parseUsdString(String(getColumnValue(microRow, 'pricing')))
  const exampleTotal = proPrice + 2 * microPrice - credits

  return `Pro and Team plans include ${usd(credits)}/month in compute credits, which covers one Micro instance. Additional projects each add their own compute cost. For example, a Pro org with 2 projects on Micro compute costs: ${usd(proPrice)} (plan) + ${usd(microPrice)} (project 1) + ${usd(microPrice)} (project 2) - ${usd(credits)} (credits) = ${usd(exampleTotal)}/month.`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export function generatePricingContent(): string {
  return [
    '# Supabase Pricing',
    '',
    '> Start for free, scale as you grow. Pay only for what you use.',
    '',
    'Supabase offers four plans: Free, Pro, Team, and Enterprise. All plans include unlimited API requests.',
    '',
    '## How billing works',
    '',
    'Supabase uses organization-based billing. You choose a plan (Pro, Team, or Enterprise) for your organization, then each project within it runs on its own compute instance. The plan subscription covers platform features and usage quotas. Compute is billed separately per project.',
    '',
    buildBillingExample(),
    '',
    'For current pricing, visit https://supabase.com/pricing.',
    '',
    'Structured pricing data (JSON): https://supabase.com/pricing.json',
    '',
    buildPlanTiersSection(),
    buildComputeSection(),
    buildDiskSection(),
    buildAddOnsSection(),
    buildFeatureComparisonSection(),
    buildFAQSection(),
    '## Links',
    '',
    '- Pricing page: https://supabase.com/pricing',
    '- Documentation: https://supabase.com/docs/guides/platform/org-based-billing',
    '- Dashboard: https://supabase.com/dashboard',
    '',
  ].join('\n')
}
