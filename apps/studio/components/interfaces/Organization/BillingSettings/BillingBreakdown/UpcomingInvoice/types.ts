import { UpcomingInvoiceResponse } from '@/data/invoices/org-invoice-upcoming-query'

export type UpcomingInvoiceData = NonNullable<UpcomingInvoiceResponse['upcomingInvoice']>
export type UpcomingInvoiceUsageLineItem =
  UpcomingInvoiceData['currentCosts']['usage']['lineItems'][number]
export type UpcomingInvoiceFixedFeeLineItem =
  UpcomingInvoiceData['currentCosts']['fixedFees']['lineItems'][number]
export type UpcomingInvoiceUsageUnit = Extract<
  UpcomingInvoiceUsageLineItem,
  { schema: 'compute' }
>['usage_unit']
export type UpcomingInvoiceProjectBreakdown = UpcomingInvoiceUsageLineItem['breakdown'][number]

export type UpcomingInvoiceAnyLineItem =
  | ({ line_item_kind: 'usage' } & UpcomingInvoiceUsageLineItem)
  | ({ line_item_kind: 'fixed-fee' } & UpcomingInvoiceFixedFeeLineItem)
