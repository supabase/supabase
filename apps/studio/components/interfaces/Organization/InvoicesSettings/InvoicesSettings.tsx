import { PermissionAction } from '@supabase/shared-types/out/constants'
import dayjs from 'dayjs'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import InvoiceStatusBadge from 'components/interfaces/Billing/InvoiceStatusBadge'
import { InvoiceStatus } from 'components/interfaces/Billing/Invoices.types'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import AlertError from 'components/ui/AlertError'
import NoPermission from 'components/ui/NoPermission'
import PartnerManagedResource from 'components/ui/PartnerManagedResource'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { getInvoice } from 'data/invoices/invoice-query'
import { useInvoicesCountQuery } from 'data/invoices/invoices-count-query'
import { useInvoicesQuery } from 'data/invoices/invoices-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { formatCurrency } from 'lib/helpers'
import { Button } from 'ui'
import CurrentPaymentMethod from '../BillingSettings/PaymentMethods/CurrentPaymentMethod'
import { FileText, Download, ChevronLeft, ChevronRight } from 'lucide-react'

const PAGE_LIMIT = 10

const InvoicesSettings = () => {
  const [page, setPage] = useState(1)

  const selectedOrganization = useSelectedOrganization()
  const { slug } = selectedOrganization ?? {}
  const offset = (page - 1) * PAGE_LIMIT

  const canReadInvoices = useCheckPermissions(PermissionAction.READ, 'invoices')

  const { data: count, isError: isErrorCount } = useInvoicesCountQuery(
    {
      slug,
    },
    { enabled: selectedOrganization?.managed_by === 'supabase' }
  )
  const { data, error, isLoading, isError, isSuccess } = useInvoicesQuery(
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

  if (!canReadInvoices) {
    return (
      <ScaffoldContainerLegacy>
        <NoPermission resourceText="view invoices" />
      </ScaffoldContainerLegacy>
    )
  }

  if (
    selectedOrganization?.managed_by !== undefined &&
    selectedOrganization?.managed_by !== 'supabase'
  ) {
    return (
      <ScaffoldContainerLegacy>
        <PartnerManagedResource
          partner={selectedOrganization?.managed_by}
          resource="Invoices"
          cta={{
            installationId: selectedOrganization?.partner_id,
            path: '/invoices',
          }}
          // TODO: support AWS marketplace here: `https://us-east-1.console.aws.amazon.com/billing/home#/bills`
        />
      </ScaffoldContainerLegacy>
    )
  }

  return (
    <ScaffoldContainerLegacy>
      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve invoices" />}

      {isSuccess && (
        <>
          <CurrentPaymentMethod />

          <Table
            head={[
              <Table.th key="header-icon"></Table.th>,
              <Table.th key="header-date">Date</Table.th>,
              <Table.th key="header-amount">Amount</Table.th>,
              <Table.th key="header-invoice">Invoice number</Table.th>,
              <Table.th key="header-status" className="flex items-center">
                Status
              </Table.th>,
              <Table.th key="header-download" className="text-right"></Table.th>,
            ]}
            body={
              invoices.length === 0 ? (
                <Table.tr>
                  <Table.td colSpan={6} className="p-3 py-12 text-center">
                    <p className="text-foreground-light">
                      {isLoading
                        ? 'Checking for invoices'
                        : 'No invoices for this organization yet'}
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
                        <Table.td>
                          <p>{formatCurrency(x.subtotal / 100)}</p>
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
                            {x.subtotal > 0 &&
                              [
                                InvoiceStatus.UNCOLLECTIBLE,
                                InvoiceStatus.OPEN,
                                InvoiceStatus.ISSUED,
                              ].includes(x.status as InvoiceStatus) && (
                                <Button asChild>
                                  <Link
                                    href={`https://redirect.revops.supabase.com/pay-invoice/${x.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    Pay Now
                                  </Link>
                                </Button>
                              )}

                            <Button
                              type="outline"
                              icon={<Download size={16} strokeWidth={1.5} />}
                              onClick={() => fetchInvoice(x.id)}
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
        </>
      )}
    </ScaffoldContainerLegacy>
  )
}

export default InvoicesSettings
