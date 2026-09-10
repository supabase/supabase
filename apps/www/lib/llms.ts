import { plans } from 'shared-data/plans'
import { pricing } from 'shared-data/pricing'

import addOnTable from '@/data/PricingAddOnTable.json'
import pricingFaq from '@/data/PricingFAQ.json'

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

function getColumnValue(row: { columns: { key: string; value: unknown }[] }, key: string): unknown {
  const col = row.columns.find((c) => c.key === key)
  if (!col) throw new Error(`Missing column "${key}"`)
  return col.value
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

  const widths = headers.map((h, i) => Math.max(h.length, ...dataRows.map((r) => r[i].length)))

  const headerRow = `| ${headers.map((h, i) => pad(h, widths[i])).join(' | ')} |`
  const separator = `| ${widths.map((w) => '-'.repeat(w)).join(' | ')} |`
  const bodyRows = dataRows.map(
    (cells) => `| ${cells.map((c, i) => pad(c, widths[i])).join(' | ')} |`
  )

  return [
    '## Compute Add-Ons',
    '',
    'All projects run on a compute instance. Pro and Team plans include Micro compute in the base price.',
    '',
    headerRow,
    separator,
    ...bodyRows,
    '',
    'Compute is billed hourly. Each project runs its own instance. Pro and Team plans include $10/month in compute credits (covers one Micro instance). Additional projects add their full compute cost.',
    '',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Disk Storage
// ---------------------------------------------------------------------------

const DISK_TYPES = [
  {
    name: 'General Purpose',
    maxSize: '16 TB',
    size: '8 GB included, then $0.125 per GB',
    iops: '3,000 IOPS included, then $0.024 per IOPS',
    throughput: '125 MB/s included, then $0.095 per MB/s',
    durability: '99.9%',
  },
  {
    name: 'High Performance',
    maxSize: '60 TB',
    size: '$0.195 per GB',
    iops: '$0.119 per IOPS',
    throughput: 'Scales automatically with IOPS',
    durability: '99.999%',
  },
]

function buildDiskSection(): string {
  const lines: string[] = ['## Disk Storage', '']

  for (const disk of DISK_TYPES) {
    lines.push(`### ${disk.name}`)
    lines.push(`- Max size: ${disk.maxSize}`)
    lines.push(`- Size: ${disk.size}`)
    lines.push(`- IOPS: ${disk.iops}`)
    lines.push(`- Throughput: ${disk.throughput}`)
    lines.push(`- Durability: ${disk.durability}`)
    lines.push('')
  }

  return lines.join('\n')
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

  const nameWidth = Math.max('Add-on'.length, ...addOns.map(([n]) => n.length))
  const priceWidth = Math.max('Price'.length, ...addOns.map(([, p]) => p.length))

  const header = `| ${pad('Add-on', nameWidth)} | ${pad('Price', priceWidth)} |`
  const separator = `| ${'-'.repeat(nameWidth)} | ${'-'.repeat(priceWidth)} |`
  const rows = addOns.map(
    ([name, price]) => `| ${pad(name, nameWidth)} | ${pad(price, priceWidth)} |`
  )

  return ['## Add-Ons', '', header, separator, ...rows, ''].join('\n')
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
    'Pro and Team plans include $10/month in compute credits, which covers one Micro instance. Additional projects each add their own compute cost. For example, a Pro org with 2 projects on Micro compute costs: $25 (plan) + $10 (project 1) + $10 (project 2) - $10 (credits) = $35/month.',
    '',
    'For current pricing, visit https://supabase.com/pricing.',
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
