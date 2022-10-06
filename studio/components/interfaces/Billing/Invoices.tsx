import { FC, useState, useEffect } from 'react'
import { Button, Loading, IconFileText, IconDownload, IconChevronLeft, IconChevronRight } from 'ui'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { get, head } from 'lib/common/fetch'
import Table from 'components/to-be-cleaned/Table'

const PAGE_LIMIT = 10

interface Props {
  projectRef: string
}

const Invoices: FC<Props> = ({ projectRef }) => {
  const { ui } = useStore()
  const [loading, setLoading] = useState<any>(false)

  const [page, setPage] = useState(1)
  const [count, setCount] = useState(0)
  const [invoices, setInvoices] = useState<any>([])

  const offset = (page - 1) * PAGE_LIMIT

  useEffect(() => {
    let cancel = false
    const page = 1

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

    setPage(page)
    fetchInvoices(page)
    fetchInvoiceCount()

    return () => {
      cancel = true
    }
  }, [])

  const fetchInvoices = async (page: number) => {
    setLoading(true)
    setPage(page)

    const offset = (page - 1) * PAGE_LIMIT
    const invoices = await get(
      `${API_URL}/projects/${projectRef}/invoices?offset=${offset}&limit=${PAGE_LIMIT}`
    )

    if (invoices.error) {
      ui.setNotification({ category: 'error', message: invoices.error.message })
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
        category: 'info',
        message: 'Unable to fetch the selected invoice',
      })
    }
  }

  return (
    <div className="container my-4 max-w-4xl space-y-1">
      <Loading active={loading}>
        <Table
          head={[
            <Table.th key="header-icon"></Table.th>,
            <Table.th key="header-date">Date</Table.th>,
            <Table.th key="header-amount">Amount due</Table.th>,
            <Table.th key="header-invoice">Invoice number</Table.th>,
            <Table.th key="header-download" className="text-right"></Table.th>,
          ]}
          body={
            invoices.length === 0 ? (
              <Table.tr>
                <Table.td colSpan={5} className="p-3 py-12 text-center">
                  <p className="text-scale-1000">
                    {loading ? 'Checking for invoices' : 'No invoices for this project yet'}
                  </p>
                </Table.td>
              </Table.tr>
            ) : (
              <>
                {invoices.map((x: any) => {
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
                      <Table.td className="align-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            type="outline"
                            icon={<IconDownload />}
                            onClick={() => fetchInvoice(x.id)}
                          />
                        </div>
                      </Table.td>
                    </Table.tr>
                  )
                })}
                <Table.tr key="navigation">
                  <Table.td colSpan={5}>
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
    </div>
  )
}

export default Invoices
