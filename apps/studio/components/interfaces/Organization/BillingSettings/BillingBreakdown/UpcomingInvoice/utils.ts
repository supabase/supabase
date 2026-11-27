import type {
  UpcomingInvoiceUsageLineItem,
  UpcomingInvoiceUsageMetric,
  UpcomingInvoiceUsageUnit,
} from './types'
import { PricingMetric } from '@/data/analytics/org-daily-stats-query'
import { DOCS_URL } from '@/lib/constants'
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

export const usageBillingDocsLink: Partial<Record<UpcomingInvoiceUsageMetric, string>> = {
  [PricingMetric.MONTHLY_ACTIVE_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users`,
  [PricingMetric.MONTHLY_ACTIVE_SSO_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users-sso`,
  [PricingMetric.MONTHLY_ACTIVE_THIRD_PARTY_USERS]: `${DOCS_URL}/guides/platform/manage-your-usage/monthly-active-users-third-party`,
  [PricingMetric.AUTH_MFA_PHONE]: `${DOCS_URL}/guides/platform/manage-your-usage/advanced-mfa-phone`,

  [PricingMetric.EGRESS]: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,
  [PricingMetric.CACHED_EGRESS]: `${DOCS_URL}/guides/platform/manage-your-usage/egress`,

  [PricingMetric.FUNCTION_INVOCATIONS]: `${DOCS_URL}/guides/platform/manage-your-usage/edge-function-invocations`,

  [PricingMetric.STORAGE_SIZE]: `${DOCS_URL}/guides/platform/manage-your-usage/storage-size`,
  [PricingMetric.STORAGE_IMAGES_TRANSFORMED]: `${DOCS_URL}/guides/platform/manage-your-usage/storage-image-transformations`,

  [PricingMetric.REALTIME_MESSAGE_COUNT]: `${DOCS_URL}/guides/platform/manage-your-usage/realtime-messages`,
  [PricingMetric.REALTIME_PEAK_CONNECTIONS]: `${DOCS_URL}/guides/platform/manage-your-usage/realtime-peak-connections`,

  [PricingMetric.CUSTOM_DOMAIN]: `${DOCS_URL}/guides/platform/manage-your-usage/custom-domains`,
  [PricingMetric.IPV4]: `${DOCS_URL}/guides/platform/manage-your-usage/ipv4`,
  [PricingMetric.PITR_7]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.PITR_14]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.PITR_28]: `${DOCS_URL}/guides/platform/manage-your-usage/point-in-time-recovery`,
  [PricingMetric.DISK_SIZE_GB_HOURS_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-size`,
  [PricingMetric.DISK_SIZE_GB_HOURS_IO2]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-size`,
  [PricingMetric.DISK_IOPS_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-iops`,
  [PricingMetric.DISK_IOPS_IO2]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-iops`,
  [PricingMetric.DISK_THROUGHPUT_GP3]: `${DOCS_URL}/guides/platform/manage-your-usage/disk-throughput`,
  [PricingMetric.LOG_DRAIN]: `${DOCS_URL}/guides/platform/manage-your-usage/log-drains`,
  [PricingMetric.LOG_DRAIN_EVENTS]: `${DOCS_URL}/guides/platform/manage-your-usage/log-drains`,
  [PricingMetric.LOG_INGESTION]: `${DOCS_URL}/guides/platform/manage-your-usage/logs-ingest`,
  [PricingMetric.LOG_QUERYING]: `${DOCS_URL}/guides/platform/manage-your-usage/logs-query`,
  [PricingMetric.LOG_STORAGE]: `${DOCS_URL}/guides/platform/manage-your-usage/logs`,
  [PricingMetric.PIPELINES_PIPELINE]: `${DOCS_URL}/guides/platform/manage-your-usage/pipelines`,
  [PricingMetric.PIPELINES_COPY_BACKFILL_DATA]: `${DOCS_URL}/guides/platform/manage-your-usage/pipelines`,
  [PricingMetric.PIPELINES_REPLICATED_DATA]: `${DOCS_URL}/guides/platform/manage-your-usage/pipelines`,
}

const computeBillingDocsLink: Record<
  Extract<UpcomingInvoiceUsageLineItem, { schema: 'compute' }>['type'],
  string
> = {
  compute: `${DOCS_URL}/guides/platform/manage-your-usage/compute`,
  branch: `${DOCS_URL}/guides/platform/manage-your-usage/branching`,
  replica: `${DOCS_URL}/guides/platform/manage-your-usage/read-replicas`,
}

export function getLineItemDocsLink(item: UpcomingInvoiceUsageLineItem) {
  if (item.schema === 'compute') {
    return computeBillingDocsLink[item.type]
  }

  const usageMetric = item.usage_metric ?? item.breakdown[0]?.variants[0]?.usage_metric
  return usageMetric ? usageBillingDocsLink[usageMetric] : undefined
}
