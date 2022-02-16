import { FC, useState, useEffect } from 'react'
import {
  Button,
  Loading,
  Typography,
  IconFileText,
  IconDownload,
  IconChevronLeft,
  IconChevronRight,
} from '@supabase/ui'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { get } from 'lib/common/fetch'
import Table from 'components/to-be-cleaned/Table'

const PAGE_LIMIT = 10

interface Props {
  organization: any
}

const InvoicesSettings: FC<Props> = ({ organization }) => {
  const { ui } = useStore()
  const [loading, setLoading] = useState<any>(false)
  const [error, setError] = useState<any>(null)

  const [page, setPage] = useState(1)
  const [invoices, setInvoices] = useState<any>(null)

  const { stripe_customer_id } = organization
  const offset = (page - 1) * PAGE_LIMIT

  useEffect(() => {
    fetchInvoices()
  }, [stripe_customer_id, page])

  const fetchInvoices = async () => {
    console.log('Fetching invoices, page:', page)
    setLoading(true)
    const invoices = await get(
      `${API_URL}/stripe/invoices?offset=${offset}&limit=${PAGE_LIMIT}&customer=${stripe_customer_id}`
    )
    setInvoices(invoices)
    setLoading(false)
  }

  return (
    <div className="my-4 container max-w-4xl space-y-1">
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
            !invoices || invoices.length === 0 ? (
              <Table.tr>
                <Table.td colSpan={5} className="p-3 py-12 text-center">
                  <Typography.Text>
                    {loading ? 'Checking for invoices' : 'No invoices for this organization yet'}
                  </Typography.Text>
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
                        <Typography.Text>
                          {new Date(x.period_end * 1000).toLocaleString()}
                        </Typography.Text>
                      </Table.td>
                      <Table.td>
                        <Typography.Text>${x.subtotal / 100}</Typography.Text>
                      </Table.td>
                      <Table.td>
                        <Typography.Text>{x.number}</Typography.Text>
                      </Table.td>
                      <Table.td className="align-right">
                        <div className="flex items-center space-x-2 justify-end">
                          <a href={x.hosted_invoice_url} target="_blank">
                            <Button type="outline">View invoice</Button>
                          </a>
                          <form method="get" action={x.invoice_pdf}>
                            <Button type="outline" icon={<IconDownload />} htmlType="submit" />
                          </form>
                        </div>
                      </Table.td>
                    </Table.tr>
                  )
                })}
                <Table.tr key="navigation">
                  <Table.td colSpan={5}>
                    <div className="flex items-center justify-between">
                      <Typography.Text type="secondary" small>
                        Showing {offset + 1} to 10 of 100 invoices
                      </Typography.Text>
                      <div className="flex items-center space-x-2">
                        <Button
                          icon={<IconChevronLeft />}
                          type="secondary"
                          size="tiny"
                          disabled={page === 1}
                          onClick={() => setPage(page - 1)}
                        />
                        <Button
                          icon={<IconChevronRight />}
                          type="secondary"
                          size="tiny"
                          disabled={invoices.length < PAGE_LIMIT}
                          onClick={() => setPage(page + 1)}
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

export default InvoicesSettings
