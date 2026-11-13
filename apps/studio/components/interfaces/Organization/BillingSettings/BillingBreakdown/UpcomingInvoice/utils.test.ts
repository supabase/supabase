import { describe, expect, test } from 'vitest'

import type { UpcomingInvoiceUsageLineItem } from './types'
import { formatDecimalBytes, formatNumber, formatUsageWithUnit, getLineItemDocsLink } from './utils'

describe('formatNumber', () => {
  test.each([
    { value: 0, expected: '0' },
    { value: 0.004, expected: '<0.01' },
    { value: 0.01, expected: '0.01' },
    { value: 1234.567, expected: '1,234.57' },
    { value: 999_999, expected: '999,999' },
    { value: 2_200_000, expected: '2.2M' },
  ])('formats $value as $expected', ({ value, expected }) => {
    expect(formatNumber(value)).toBe(expected)
  })
})

describe('formatDecimalBytes', () => {
  test.each([
    { bytes: 0, expected: '0 B' },
    { bytes: 0.5, expected: '0.5 B' },
    { bytes: 999, expected: '999 B' },
    // Billing uses decimal units, so 1024 bytes is not 1 KB
    { bytes: 1024, expected: '1.02 KB' },
    { bytes: 1_500_000_000, expected: '1.5 GB' },
    // Caps at PB instead of indexing past the unit list
    { bytes: 2e18, expected: '2,000 PB' },
  ])('formats $bytes bytes as $expected', ({ bytes, expected }) => {
    expect(formatDecimalBytes(bytes)).toBe(expected)
  })
})

describe('formatUsageWithUnit', () => {
  test.each([
    { usage: 1, unit: 'hour', expected: '1 hour' },
    { usage: 0, unit: 'hour', expected: '0 hours' },
    { usage: 1.5, unit: 'gbhr', expected: '1.5 GB-hours' },
    { usage: 3_500_000, unit: 'iopshr', expected: '3.5M IOPS-hours' },
    { usage: 1, unit: 'gigabyte', expected: '1 GB' },
    { usage: 42, unit: 'count', expected: '42' },
    { usage: 1_500, unit: 'byte', expected: '1.5 KB' },
  ] as const)('formats $usage $unit as $expected', ({ usage, unit, expected }) => {
    expect(formatUsageWithUnit(usage, unit)).toBe(expected)
  })
})

describe('getLineItemDocsLink', () => {
  const period = { start: '2026-11-01T00:00:00Z', end: '2026-12-01T00:00:00Z' }

  const computeItem = (
    type: Extract<UpcomingInvoiceUsageLineItem, { schema: 'compute' }>['type']
  ): UpcomingInvoiceUsageLineItem => ({
    schema: 'compute',
    type,
    name: 'Compute',
    period,
    usage_unit: 'hour',
    pre_tax_amount: 0,
    pre_tax_amount_before_discount: 0,
    compute_credits_used: null,
    breakdown: [],
  })

  const genericItem = (
    details: Partial<Extract<UpcomingInvoiceUsageLineItem, { schema: 'generic' }>>
  ): UpcomingInvoiceUsageLineItem => ({
    schema: 'generic',
    name: 'Usage',
    description: 'Usage',
    period,
    pre_tax_amount: 0,
    pre_tax_amount_before_discount: 0,
    quantity: null,
    unit_price: null,
    unit_price_desc: null,
    breakdown: [],
    ...details,
  })

  test.each([
    { type: 'compute', page: 'compute' },
    { type: 'branch', page: 'branching' },
    { type: 'replica', page: 'read-replicas' },
  ] as const)('links $type compute to the $page docs', ({ type, page }) => {
    expect(getLineItemDocsLink(computeItem(type))).toMatch(
      new RegExp(`/guides/platform/manage-your-usage/${page}$`)
    )
  })

  test('links a usage item by its usage metric', () => {
    expect(getLineItemDocsLink(genericItem({ usage_metric: 'LOG_INGESTION' }))).toMatch(
      /\/guides\/platform\/manage-your-usage\/logs-ingest$/
    )
  })

  test('falls back to the usage metric of its project breakdown', () => {
    const item = genericItem({
      breakdown: [
        {
          project_name: 'Project A',
          project_ref: 'project-a',
          total_usage: 10,
          variants: [
            {
              name: 'gp3',
              is_active_variant: true,
              usage: 10,
              usage_metric: 'DISK_SIZE_GB_HOURS_GP3',
              pre_tax_amount: 0,
              pre_tax_amount_before_discount: 0,
              unit_price_desc: null,
            },
          ],
        },
      ],
    })

    expect(getLineItemDocsLink(item)).toMatch(/\/guides\/platform\/manage-your-usage\/disk-size$/)
  })

  test('has no link for a metric without a docs page', () => {
    expect(getLineItemDocsLink(genericItem({ usage_metric: 'FUNCTION_CPU_MILLISECONDS' }))).toBe(
      undefined
    )
  })
})
