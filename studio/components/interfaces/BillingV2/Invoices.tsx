import { useParams } from 'common'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Button, IconChevronLeft, IconChevronRight, IconDownload, IconFileText, Loading } from 'ui'

import Table from 'components/to-be-cleaned/Table'
import { getProjectInvoice } from 'data/invoices/project-invoice-query'
import { useProjectInvoicesQuery } from 'data/invoices/project-invoices-query'
import { useStore } from 'hooks'
import { head } from 'lib/common/fetch'
import { API_URL } from 'lib/constants'
import InvoiceStatusBadge from './InvoiceStatusBadge'
import { InvoiceStatus } from './Invoices.types'

const PAGE_LIMIT = 10

const Invoices = () => {
  const { ui } = useStore()
  const { ref: projectRef } = useParams()

  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)

  const offset = (page - 1) * PAGE_LIMIT
  const { data, isLoading } = useProjectInvoicesQuery({ projectRef, limit: PAGE_LIMIT, offset })
  const invoices = data || []

  // [JOSHEN TODO] How to extract the X-Total-Count?
  // const { data: invoicesCount, error } = useProjectInvoicesCountQuery({ projectRef })
  // console.log({ invoicesCount, error })

  useEffect(() => {
    if (!projectRef) return

    setPage(1)
    let cancel = false

    const fetchInvoiceCount = async () => {
      const res = await head(`${API_URL}/projects/${projectRef}/invoices`, ['X-Total-Count'])
      if (!cancel) {
        if (res.error) {
          ui.setNotification({ category: 'error', message: res.error.message })
        } else {
          setCount(res['X-Total-Count'])
        }
      }
    }

    fetchInvoiceCount()

    return () => {
      cancel = true
    }
  }, [projectRef])

  const fetchInvoice = async (id: string) => {
    try {
      const invoice = await getProjectInvoice({ id })
      if (invoice?.invoice_pdf) window.open(invoice.invoice_pdf, '_blank')
    } catch (error: any) {
      ui.setNotification({
        category: 'info',
        message: `Failed to fetch the selected invoice: ${error.message}`,
      })
    }
  }

  return (
    <div className="container my-4 max-w-4xl space-y-1">
      <Loading active={isLoading}>
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
                    {isLoading ? 'Checking for invoices' : 'No invoices for this project yet'}
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
                        <p>
                          {x.subtotal >= 0
                            ? `$${x.subtotal / 100}`
                            : `-$${Math.abs(x.subtotal / 100)}`}
                        </p>
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
                          onClick={async () => setPage(page - 1)}
                        />
                        <Button
                          icon={<IconChevronRight />}
                          type="default"
                          size="tiny"
                          disabled={page * PAGE_LIMIT >= count}
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
      </Loading>
    </div>
  )
}

export default Invoices
