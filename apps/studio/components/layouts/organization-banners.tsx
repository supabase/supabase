import { useOverdueInvoicesQuery } from 'data/invoices/invoices-overdue-query'

export function OrganizationBanners() {
  const { data: allOverdueInvoices } = useOverdueInvoicesQuery()
  const { data: resourceWarnings } = useResourceWarningsQuery()
}
