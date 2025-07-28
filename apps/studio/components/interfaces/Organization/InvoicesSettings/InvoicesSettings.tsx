import dayjs from 'dayjs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import InvoiceStatusBadge from 'components/interfaces/Billing/InvoiceStatusBadge'
import { InvoiceStatus } from 'components/interfaces/Billing/Invoices.types'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { getInvoice } from 'data/invoices/invoice-query'
import { useInvoicesCountQuery } from 'data/invoices/invoices-count-query'
import { useInvoicesQuery } from 'data/invoices/invoices-query'
import { formatCurrency } from 'lib/helpers'
import { ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'
import { Button } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import InvoicePayButton from './InvoicePayButton'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'

const PAGE_LIMIT = 5

const InvoicesSettings = () => {
  const [page, setPage] = useState(1)

  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const slug = selectedOrganization?.slug
  const offset = (page - 1) * PAGE_LIMIT

  const { data: count, isError: isErrorCount } = useInvoicesCountQuery(
    {
      slug,
    },
    { enabled: selectedOrganization?.managed_by === 'supabase' }
  )
  const { data, error, isLoading, isError } = useInvoicesQuery(
    {
      slug,
      offset,
      limit: PAGE_LIMIT,
    },
    { enabled: selectedOrganization?.managed_by === 'supabase' }
  )
  const invoices = data || []

  useEffect(() => {
    setPage(1)
  }, [slug])

  const fetchInvoice = async (id: string) => {
    try {
      const invoice = await getInvoice({ invoiceId: id, slug })
      if (invoice?.invoice_pdf) window.open(invoice.invoice_pdf, '_blank')
    } catch (error: any) {
      toast.error(`Failed to fetch the selected invoice: ${error.message}`)
    }
  }

  if (
    selectedOrganization?.managed_by !== undefined &&
    selectedOrganization?.managed_by !== 'supabase'
  ) {
    return (
      <PartnerManagedResource
        partner={selectedOrganization?.managed_by}
        resource="Invoices"
        cta={{
          installationId: selectedOrganization?.partner_id,
          path: '/invoices',
        }}
        // TODO: support AWS marketplace here: `https://us-east-1.console.aws.amazon.com/billing/home#/bills`
      />
    )
  }

  return (
    <div className="overflow-hidden md:overflow-auto overflow-x-scroll">
      <Table
        head={[
          <Table.th key="header-icon" />,
          <Table.th key="header-date">Date</Table.th>,
          <Table.th key="header-amount">Amount</Table.th>,
          <Table.th key="header-invoice">Invoice number</Table.th>,
          <Table.th key="header-status" className="flex items-center">
            Status
          </Table.th>,
          <Table.th key="header-download" className="text-right"></Table.th>,
        ]}
        body={
          isLoading ? (
            new Array(6).fill(0).map((_, idx) => (
              <Table.tr key={`loading-${idx}`}>
                <Table.td>{idx !== 5 && <FileText size="24" />}</Table.td>
                <Table.td colSpan={5}>
                  <ShimmeringLoader />
                </Table.td>
              </Table.tr>
            ))
          ) : isError ? (
            <Table.tr className="rounded-b">
              <Table.td colSpan={6} className="!p-0 !rounded-b overflow-hidden">
                <AlertError
                  className="border-0 rounded-none"
                  error={error}
                  subject="Failed to retrieve invoices"
                />
              </Table.td>
            </Table.tr>
          ) : invoices.length === 0 ? (
            <Table.tr>
              <Table.td colSpan={6} className="p-3 py-12 text-center">
                <p className="text-foreground-light">
                  {isLoading ? 'Checking for invoices' : 'No invoices for this organization yet'}
                </p>
              </Table.td>
            </Table.tr>
          ) : (
            <>
              {invoices.map((x) => {
                return (
                  <Table.tr key={x.id}>
                    <Table.td>
                      <FileText size="24" />
                    </Table.td>
                    <Table.td>
                      <p>{dayjs(x.period_end * 1000).format('MMM DD, YYYY')}</p>
                    </Table.td>
                    <Table.td translate="no">
                      <p>{formatCurrency(x.amount_due / 100)}</p>
                    </Table.td>
                    <Table.td>
                      <p>{x.number}</p>
                    </Table.td>
                    <Table.td>
                      <InvoiceStatusBadge
                        status={x.status as InvoiceStatus}
                        paymentAttempted={x.payment_attempted}
                      />
                    </Table.td>
                    <Table.td className="align-right">
                      <div className="flex items-center justify-end space-x-2">
                        {x.amount_due > 0 &&
                          [
                            InvoiceStatus.UNCOLLECTIBLE,
                            InvoiceStatus.OPEN,
                            InvoiceStatus.ISSUED,
                          ].includes(x.status as InvoiceStatus) && (
                            <InvoicePayButton slug={slug} invoiceId={x.id} />
                          )}

                        <ButtonTooltip
                          type="outline"
                          className="w-7"
                          icon={<Download size={16} strokeWidth={1.5} />}
                          onClick={() => fetchInvoice(x.id)}
                          tooltip={{ content: { side: 'bottom', text: 'Download invoice' } }}
                        />
                      </div>
                    </Table.td>
                  </Table.tr>
                )
              })}
              <Table.tr key="navigation">
                <Table.td colSpan={6}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm opacity-50">
                      {isErrorCount
                        ? 'Failed to retrieve total number of invoices'
                        : `Showing ${offset + 1} to ${
                            offset + invoices.length
                          } out of ${count} invoices`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <Button
                        icon={<ChevronLeft />}
                        type="default"
                        size="tiny"
                        disabled={page === 1}
                        onClick={async () => setPage(page - 1)}
                      />
                      <Button
                        icon={<ChevronRight />}
                        type="default"
                        size="tiny"
                        disabled={page * PAGE_LIMIT >= (count ?? 0)}
                        onClick={async () => setPage(page + 1)}
                      />
                    </div>
                  </div>
                </Table.td>
              </Table.tr>
            </>
          )
        }
      />
    </div>
  )
}

export default InvoicesSettings
