// @ts-check

/**
 * Generates apps/www/public/llms/pricing.txt from structured pricing data.
 *
 * Source data:
 *   - packages/shared-data/plans.ts   (plan tiers, features, cta copy)
 *   - packages/shared-data/pricing.ts (per-feature plan values)
 *   - apps/www/data/PricingAddOnTable.json (compute add-on rows)
 *   - apps/www/components/Pricing/PricingDiskSection.tsx (disk type data - inlined below)
 *
 * Run: node apps/www/scripts/generateLlmsPricing.mjs
 * (Uses tsx for TypeScript imports, falling back to inlined data if unavailable)
 */

import { execSync } from 'child_process'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../../..')

// ---------------------------------------------------------------------------
// Load TypeScript source data via tsx
// ---------------------------------------------------------------------------

// We shell out to tsx to load the TypeScript modules and dump them as JSON.
// tsx is available in the monorepo node_modules.
const tsxBin = path.join(repoRoot, 'node_modules/.bin/tsx')

const loadTsData = async (tsFile, exportName) => {
  const tmpFile = path.join(os.tmpdir(), `generate-llms-pricing-${exportName}-${Date.now()}.ts`)
  await fs.writeFile(
    tmpFile,
    `import { ${exportName} } from '${tsFile}'\nprocess.stdout.write(JSON.stringify(${exportName}))\n`,
    'utf8'
  )
  try {
    const result = execSync(`"${tsxBin}" "${tmpFile}"`, { encoding: 'utf8', cwd: repoRoot })
    return JSON.parse(result)
  } finally {
    await fs.unlink(tmpFile).catch(() => {})
  }
}

const plans = await loadTsData(path.join(repoRoot, 'packages/shared-data/plans.ts'), 'plans')

const pricing = await loadTsData(path.join(repoRoot, 'packages/shared-data/pricing.ts'), 'pricing')

const addOnTablePath = path.join(__dirname, '../data/PricingAddOnTable.json')
const addOnTable = JSON.parse(await fs.readFile(addOnTablePath, 'utf8'))

// ---------------------------------------------------------------------------
// Disk types (sourced from PricingDiskSection.tsx - inlined here for
// portability; keep in sync if that component's data changes)
// ---------------------------------------------------------------------------

const diskTypes = [
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatPlanValue = (val) => {
  if (val === true) return 'Included'
  if (val === false) return 'Not included'
  if (Array.isArray(val)) return val.join(', ')
  return String(val)
}

const getVal = (row, key) => {
  const col = row.columns.find((c) => c.key === key)
  if (!col)
    throw new Error(`Missing column "${key}" in compute add-on row "${row.title || 'unknown'}"`)
  return col.value
}

const pad = (str, len) => String(str).padEnd(len)

const getPlanValue = (feature, planId) => {
  if (!(planId in feature.plans)) {
    throw new Error(`Missing plan value for "${planId}" in feature "${feature.key}"`)
  }
  return formatPlanValue(feature.plans[planId])
}

// ---------------------------------------------------------------------------
// Plan Tiers section
// ---------------------------------------------------------------------------

const buildPlanTiersSection = () => {
  const lines = ['## Plan Tiers', '']

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
// Compute Add-Ons section
// ---------------------------------------------------------------------------

const buildComputeSection = () => {
  const rows = addOnTable.database.rows

  const colWidths = {
    plan: 'Size'.length,
    price: '$/month'.length,
    cpu: 'CPU'.length,
    dedicated: 'Dedicated'.length,
    memory: 'RAM'.length,
    direct: 'Direct Connections'.length,
    pooler: 'Pooler Connections'.length,
  }

  for (const row of rows) {
    colWidths.plan = Math.max(colWidths.plan, String(getVal(row, 'plan')).length)
    colWidths.price = Math.max(colWidths.price, String(getVal(row, 'pricing')).length)
    colWidths.cpu = Math.max(colWidths.cpu, String(getVal(row, 'cpu')).length)
    colWidths.dedicated = Math.max(
      colWidths.dedicated,
      getVal(row, 'dedicated') ? 'Yes'.length : 'No'.length
    )
    colWidths.memory = Math.max(colWidths.memory, String(getVal(row, 'memory')).length)
    colWidths.direct = Math.max(colWidths.direct, String(getVal(row, 'directConnections')).length)
    colWidths.pooler = Math.max(colWidths.pooler, String(getVal(row, 'poolerConnections')).length)
  }

  const header = `| ${pad('Size', colWidths.plan)} | ${pad('$/month', colWidths.price)} | ${pad('CPU', colWidths.cpu)} | ${pad('Dedicated', colWidths.dedicated)} | ${pad('RAM', colWidths.memory)} | ${pad('Direct Connections', colWidths.direct)} | ${pad('Pooler Connections', colWidths.pooler)} |`
  const separator = `| ${'-'.repeat(colWidths.plan)} | ${'-'.repeat(colWidths.price)} | ${'-'.repeat(colWidths.cpu)} | ${'-'.repeat(colWidths.dedicated)} | ${'-'.repeat(colWidths.memory)} | ${'-'.repeat(colWidths.direct)} | ${'-'.repeat(colWidths.pooler)} |`

  const dataRows = rows.map((row) => {
    const plan = String(getVal(row, 'plan'))
    const price = String(getVal(row, 'pricing'))
    const cpu = String(getVal(row, 'cpu'))
    const dedicated = getVal(row, 'dedicated') ? 'Yes' : 'No'
    const memory = String(getVal(row, 'memory'))
    const direct = String(getVal(row, 'directConnections'))
    const pooler = String(getVal(row, 'poolerConnections'))

    return `| ${pad(plan, colWidths.plan)} | ${pad(price, colWidths.price)} | ${pad(cpu, colWidths.cpu)} | ${pad(dedicated, colWidths.dedicated)} | ${pad(memory, colWidths.memory)} | ${pad(direct, colWidths.direct)} | ${pad(pooler, colWidths.pooler)} |`
  })

  return [
    '## Compute Add-Ons',
    '',
    'All projects run on a compute instance. Pro and Team plans include Micro compute in the base price.',
    '',
    header,
    separator,
    ...dataRows,
    '',
    'Compute is billed hourly. Each project runs its own instance. Pro and Team plans include $10/month in compute credits (covers one Micro instance). Additional projects add their full compute cost.',
    '',
  ].join('\n')
}

// ---------------------------------------------------------------------------
// Disk Storage section
// ---------------------------------------------------------------------------

const buildDiskSection = () => {
  const lines = ['## Disk Storage', '']

  for (const disk of diskTypes) {
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
// Add-Ons section (from pricing.ts feature values)
// ---------------------------------------------------------------------------

const findFeature = (category, key) => {
  const feature = pricing[category].features.find((f) => f.key === key)
  if (!feature) throw new Error(`Missing pricing feature "${key}" in category "${category}"`)
  return feature
}

const buildAddOnsSection = () => {
  const addOns = [
    [
      'Point-in-Time Recovery (PITR)',
      getPlanValue(findFeature('database', 'database.pitr'), 'pro'),
    ],
    ['Custom Domain', getPlanValue(findFeature('security', 'security.customDomains'), 'pro')],
    ['Database Branching', getPlanValue(findFeature('database', 'database.branching'), 'pro')],
    ['Advanced MFA (Phone)', getPlanValue(findFeature('auth', 'auth.advancedMFAPhone'), 'pro')],
    ['SAML/SSO Auth', getPlanValue(findFeature('auth', 'auth.saml'), 'pro')],
    ['Log Drains', getPlanValue(findFeature('security', 'security.logDrain'), 'pro')],
    [
      'Image Transformations',
      getPlanValue(findFeature('storage', 'storage.transformations'), 'pro'),
    ],
  ]

  const nameWidth = Math.max('Add-on'.length, ...addOns.map(([n]) => n.length))
  const priceWidth = Math.max('Price'.length, ...addOns.map(([, p]) => p.length))

  const header = `| ${pad('Add-on', nameWidth)} | ${pad('Price', priceWidth)} |`
  const separator = `| ${'-'.repeat(nameWidth)} | ${'-'.repeat(priceWidth)} |`
  const dataRows = addOns.map(
    ([name, price]) => `| ${pad(name, nameWidth)} | ${pad(price, priceWidth)} |`
  )

  return ['## Add-Ons', '', header, separator, ...dataRows, ''].join('\n')
}

// ---------------------------------------------------------------------------
// Full feature comparison (per category from pricing.ts)
// ---------------------------------------------------------------------------

const buildFeatureComparisonSection = () => {
  const planIds = ['free', 'pro', 'team', 'enterprise']
  const planLabels = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' }

  const lines = ['## Full Feature Comparison', '']

  for (const [, category] of Object.entries(pricing)) {
    lines.push(`### ${category.title}`, '')

    const nameWidth = Math.max('Feature'.length, ...category.features.map((f) => f.title.length))
    const planWidths = {}
    for (const planId of planIds) {
      planWidths[planId] = Math.max(
        planLabels[planId].length,
        ...category.features.map((f) => getPlanValue(f, planId).length)
      )
    }

    const headerRow = `| ${pad('Feature', nameWidth)} | ${planIds.map((p) => pad(planLabels[p], planWidths[p])).join(' | ')} |`
    const separatorRow = `| ${'-'.repeat(nameWidth)} | ${planIds.map((p) => '-'.repeat(planWidths[p])).join(' | ')} |`

    lines.push(headerRow, separatorRow)

    for (const feature of category.features) {
      const cells = planIds.map((p) => pad(getPlanValue(feature, p), planWidths[p]))
      lines.push(`| ${pad(feature.title, nameWidth)} | ${cells.join(' | ')} |`)
    }

    lines.push('')
  }

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Assemble final output
// ---------------------------------------------------------------------------

const output = [
  '# Supabase Pricing',
  '',
  '> Note: this file is auto-generated from packages/shared-data. Do not edit directly.',
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
  '## Links',
  '',
  '- Pricing page: https://supabase.com/pricing',
  '- Documentation: https://supabase.com/docs/guides/platform/org-based-billing',
  '- Dashboard: https://supabase.com/dashboard',
  '',
].join('\n')

// ---------------------------------------------------------------------------
// Write output
// ---------------------------------------------------------------------------

const outputPath = path.join(__dirname, '../public/llms/pricing.txt')
await fs.writeFile(outputPath, output, 'utf8')

console.log(`✅ Generated ${outputPath}`)
