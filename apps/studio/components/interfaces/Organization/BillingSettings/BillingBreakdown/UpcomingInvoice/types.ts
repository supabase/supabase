import { UpcomingInvoiceResponse } from '@/data/invoices/org-invoice-upcoming-query'

export type UpcomingInvoiceV2Dto = NonNullable<UpcomingInvoiceResponse['upcomingInvoice']>
export type UsageLineItem = UpcomingInvoiceV2Dto['currentCosts']['usage']['lineItems'][number]
export type FixedFeeLineItem =
  UpcomingInvoiceV2Dto['currentCosts']['fixedFees']['lineItems'][number]
export type UsageUnit = Extract<UsageLineItem, { schema: 'compute' }>['usage_unit']
export type ProjectBreakdown = UsageLineItem['breakdown'][number]

export type AnyLineItem =
  | ({ line_item_kind: 'usage' } & UsageLineItem)
  | ({ line_item_kind: 'fixed-fee' } & FixedFeeLineItem)
