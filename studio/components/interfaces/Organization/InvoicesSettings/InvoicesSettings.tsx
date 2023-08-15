import { PermissionAction } from '@supabase/shared-types/out/constants'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { InvoiceStatusBadge } from 'components/interfaces/BillingV2'
import { Invoice, InvoiceStatus } from 'components/interfaces/BillingV2/Invoices.types'
import Table from 'components/to-be-cleaned/Table'
import NoPermission from 'components/ui/NoPermission'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { get, head } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import { Button, IconChevronLeft, IconChevronRight, IconDownload, IconFileText, Loading } from 'ui'
import { ScaffoldContainerLegacy } from 'components/layouts/Scaffold'

const PAGE_LIMIT = 10

// Refactor: Split invoices by projects so it's easier for users to identify

const InvoicesSettings = () => {
  const { ui } = useStore()
  const [loading, setLoading] = useState<any>(false)

  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [invoices, setInvoices] = useState<Invoice[]>([])

  const selectedOrganization = useSelectedOrganization()
  const { stripe_customer_id, slug } = selectedOrganization ?? {}
  const offset = (page - 1) * PAGE_LIMIT

  const canReadInvoices = useCheckPermissions(PermissionAction.READ, 'invoices')

  useEffect(() => {
    if (!canReadInvoices || !stripe_customer_id || !slug) return

    let cancel = false
    const page = 1

    const fetchInvoiceCount = async () => {
      const res = await head(
        `${API_URL}/stripe/invoices?customer=${stripe_customer_id}&slug=${slug}`,
        ['X-Total-Count']
      )
      if (!cancel) {
        if (res.error) {
          ui.setNotification({ category: 'error', message: res.error.message })
        } else {
          setCount(res['X-Total-Count'])
        }
      }
    }

    setPage(page)
    fetchInvoices(page)
    fetchInvoiceCount()

    return () => {
      cancel = true
    }
  }, [stripe_customer_id, slug])

  const fetchInvoices = async (page: number) => {
    setLoading(true)
    setPage(page)

    const offset = (page - 1) * PAGE_LIMIT
    const invoices = await get(
      `${API_URL}/stripe/invoices?offset=${offset}&limit=${PAGE_LIMIT}&customer=${stripe_customer_id}&slug=${slug}`
    )

    if (invoices.error) {
      ui.setNotification({
        error: invoices.error,
        category: 'error',
        message: `Failed to fetch invoices: ${invoices.error.message}`,
      })
    } else {
      setInvoices(invoices)
    }

    setLoading(false)
  }

  const fetchInvoice = async (invoiceId: string) => {
    const invoice = await get(`${API_URL}/stripe/invoices/${invoiceId}`)
    if (invoice?.invoice_pdf) {
      window.open(invoice.invoice_pdf, '_blank')
    } else {
      ui.setNotification({
        error: invoice.error,
        category: 'info',
        message: `Unable to fetch the selected invoice: ${invoice.error.message}`,
      })
    }
  }

  if (!canReadInvoices) {
    return <NoPermission resourceText="view invoices" />
  }

  return (
    <ScaffoldContainerLegacy>
      <Loading active={loading}>
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
                    {loading ? 'Checking for invoices' : 'No invoices for this organization yet'}
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
                        Showing {offset + 1} to {offset + invoices.length} out of {count} invoices
                      </p>
                      <div className="flex items-center space-x-2">
                        <Button
                          icon={<IconChevronLeft />}
                          type="default"
                          size="tiny"
                          disabled={page === 1}
                          onClick={async () => await fetchInvoices(page - 1)}
                        />
                        <Button
                          icon={<IconChevronRight />}
                          type="default"
                          size="tiny"
                          disabled={page * PAGE_LIMIT >= count}
                          onClick={async () => await fetchInvoices(page + 1)}
                        />
                      </div>
                    </div>
                  </Table.td>
                </Table.tr>
              </>
            )
          }
        />
      </Loading>
    </ScaffoldContainerLegacy>
  )
}

export default InvoicesSettings
