import { UpcomingInvoiceUsageUnit } from './types'
import { pluralize } from '@/lib/helpers'

const USAGE_UNIT_LABELS: Record<
  Exclude<UpcomingInvoiceUsageUnit, 'byte'>,
  { singular: string; plural: string } | null
> = {
  gigabyte: { singular: 'GB', plural: 'GB' },
  hour: { singular: 'hour', plural: 'hours' },
  gbhr: { singular: 'GB-hour', plural: 'GB-hours' },
  mbpshr: { singular: 'Mbps-hour', plural: 'Mbps-hours' },
  iopshr: { singular: 'IOPS-hour', plural: 'IOPS-hours' },
  count: null, // no label for count
}

const BYTE_UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']

// Above this, full numbers get hard to scan (e.g. IOPS-hours), so switch to 2.2M-style notation
const COMPACT_NOTATION_THRESHOLD = 1_000_000

export function formatNumber(value: number) {
  // Avoid very low usage displaying as "0"
  if (value > 0 && value < 0.01) return '<0.01'

  return value.toLocaleString(undefined, {
    maximumFractionDigits: 2,
    notation: Math.abs(value) >= COMPACT_NOTATION_THRESHOLD ? 'compact' : 'standard',
  })
}

/** Decimal (base 1000) units, matching how usage is billed — unlike `formatBytes` (base 1024) */
export function formatDecimalBytes(bytes: number) {
  if (bytes === 0) return '0 B'

  const exponent = Math.min(Math.floor(Math.log10(Math.abs(bytes)) / 3), BYTE_UNITS.length - 1)
  return `${formatNumber(bytes / 1000 ** Math.max(exponent, 0))} ${BYTE_UNITS[Math.max(exponent, 0)]}`
}

export function formatUsageWithUnit(usage: number, unit: UpcomingInvoiceUsageUnit) {
  if (unit === 'byte') return formatDecimalBytes(usage)

  const formattedUsage = formatNumber(usage)
  const label = USAGE_UNIT_LABELS[unit]
  if (!label) return formattedUsage

  return `${formattedUsage} ${pluralize(usage, label.singular, label.plural)}`
}
