import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { InvoiceStatusBadge } from 'components/interfaces/BillingV2'
import { InvoiceStatus } from 'components/interfaces/BillingV2/Invoices.types'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'
import Table from 'components/to-be-cleaned/Table'
import NoPermission from 'components/ui/NoPermission'
import { getInvoice } from 'data/invoices/invoice-query'
import { useInvoicesCountQuery } from 'data/invoices/invoices-count-query'
import { useInvoicesQuery } from 'data/invoices/invoices-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { Button, IconChevronLeft, IconChevronRight, IconDownload, IconFileText, Loading } from 'ui'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'

const PAGE_LIMIT = 10

const InvoicesSettings = () => {
  const { ui } = useStore()
  const [page, setPage] = useState(1)

  const selectedOrganization = useSelectedOrganization()
  const { stripe_customer_id, slug } = selectedOrganization ?? {}
  const offset = (page - 1) * PAGE_LIMIT

  const canReadInvoices = useCheckPermissions(PermissionAction.READ, 'invoices')

  const { data: count, isError: isErrorCount } = useInvoicesCountQuery({
    customerId: stripe_customer_id,
    slug,
  })
  const { data, error, isLoading, isError, isSuccess } = useInvoicesQuery({
    customerId: stripe_customer_id,
    slug,
    offset,
    limit: PAGE_LIMIT,
  })
  const invoices = data || []

  useEffect(() => {
    setPage(1)
  }, [slug])

  const fetchInvoice = async (id: string) => {
    try {
      const invoice = await getInvoice({ id })
      if (invoice?.invoice_pdf) window.open(invoice.invoice_pdf, '_blank')
    } catch (error: any) {
      ui.setNotification({
        category: 'info',
        message: `Failed to fetch the selected invoice: ${error.message}`,
      })
    }
  }

  if (!canReadInvoices) {
    return <NoPermission resourceText="view invoices" />
  }

  return (
    <ScaffoldContainerLegacy>
      {isLoading && <GenericSkeletonLoader />}

      {isError && <AlertError error={error} subject="Failed to retrieve invoices" />}

      {isSuccess && (
        <Table
          head={[
            <Table.th key="header-icon"></Table.th>,
            <Table.th key="header-date">Date</Table.th>,
            <Table.th key="header-amount">Amount due</Table.th>,
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
                  <p className="text-scale-1000">
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
                        <IconFileText size="xxl" />
                      </Table.td>
                      <Table.td>
                        <p>{new Date(x.period_end * 1000).toLocaleString()}</p>
                      </Table.td>
                      <Table.td>
                        <p>${x.subtotal / 100}</p>
                      </Table.td>
                      <Table.td>
                        <p>{x.number}</p>
                      </Table.td>
                      <Table.td>
                        <InvoiceStatusBadge status={x.status} />
                      </Table.td>
                      <Table.td className="align-right">
                        <div className="flex items-center justify-end space-x-2">
                          {[InvoiceStatus.UNCOLLECTIBLE, InvoiceStatus.OPEN].includes(x.status) && (
                            <Link href={`https://redirect.revops.supabase.com/pay-invoice/${x.id}`}>
                              <a target="_blank" rel="noreferrer">
                                <Button>Pay Now</Button>
                              </a>
                            </Link>
                          )}

                          <Button
                            type="outline"
                            icon={<IconDownload size={16} strokeWidth={1.5} />}
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
                          icon={<IconChevronLeft />}
                          type="default"
                          size="tiny"
                          disabled={page === 1}
                          onClick={async () => setPage(page - 1)}
                        />
                        <Button
                          icon={<IconChevronRight />}
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
      )}
    </ScaffoldContainerLegacy>
  )
}

export default InvoicesSettings
