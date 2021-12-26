import { FC, useState, useEffect } from 'react'
import { Button, Loading, Typography, IconFileText, IconDownload } from '@supabase/ui'

import { useStore } from 'hooks'
import { API_URL } from 'lib/constants'
import { post } from 'lib/common/fetch'
import Table from 'components/to-be-cleaned/Table'

interface Props {
  organization: any
}

const InvoicesSettings: FC<Props> = ({ organization }) => {
  const { ui } = useStore()
  const [loading, setLoading] = useState<any>(false)
  const [error, setError] = useState<any>(null)
  const [stripeAccount, setStripeAccount] = useState<any>(null)
  const { stripe_customer_id } = organization

  /**
   * Get stripe account to populate page
   */
  const getStripeAccount = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await post(`${API_URL}/stripe/customer`, {
        stripe_customer_id: stripe_customer_id,
      })
      setStripeAccount(response)
    } catch (error: any) {
      ui.setNotification({
        category: 'error',
        message: `Failed to get Stripe account: ${error.message}`,
      })
      setError(error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getStripeAccount()
  }, [stripe_customer_id])

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
            !stripeAccount || (stripeAccount && stripeAccount.invoices?.data <= 0) ? (
              <Table.tr>
                <Table.td colSpan={5} className="p-3 py-12 text-center">
                  <Typography.Text>
                    {loading ? 'Checking for invoices' : 'No invoices for this organization yet'}
                  </Typography.Text>
                </Table.td>
              </Table.tr>
            ) : (
              stripeAccount.invoices?.data.map((x: any) => {
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
              })
            )
          }
        />
      </Loading>
    </div>
  )
}

export default InvoicesSettings
