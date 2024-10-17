export enum InvoiceStatus {
  DRAFT = 'draft',
  PAID = 'paid',
  VOID = 'void',
  UNCOLLECTIBLE = 'uncollectible',
  OPEN = 'open',
  ISSUED = 'issued',
}

export type Invoice = {
  id: string
  number: string
  period_end: number
  subtotal: number
  status: InvoiceStatus
}
