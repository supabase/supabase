import clsx from 'clsx'
import { partition } from 'lodash'

import AlertError from 'components/ui/AlertError'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useOrgUpcomingInvoiceQuery } from 'data/invoices/org-invoice-upcoming-query'
import { useState } from 'react'
import { Button, Collapsible, IconChevronRight } from 'ui'

export interface UpcomingInvoiceProps {
  slug?: string
}

const UpcomingInvoice = ({ slug }: UpcomingInvoiceProps) => {
  const {
    data: upcomingInvoice,
    error: error,
    isLoading,
    isError,
    isSuccess,
  } = useOrgUpcomingInvoiceQuery({ orgSlug: slug })

  const [showUsageFees, setShowUsageFees] = useState(false)
  const [usageFees, fixedFees] = partition(upcomingInvoice?.lines ?? [], (item) => item.usage_based)
  const totalUsageFees = Number(usageFees.reduce((a, b) => a + b.amount, 0).toFixed(2))

  return (
    <>
      {isLoading && (
        <div className="space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      )}

      {isError && <AlertError subject="Failed to retrieve upcoming invoice" error={error} />}

      {isSuccess && (
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="py-2 font-normal text-left text-sm text-foreground-light w-1/2">
                Item
              </th>
              <th className="py-2 font-normal text-left text-sm text-foreground-light">Count</th>
              <th className="py-2 font-normal text-left text-sm text-foreground-light">
                Unit price
              </th>
              <th className="py-2 font-normal text-right text-sm text-foreground-light">Price</th>
            </tr>
          </thead>
          <tbody>
            {fixedFees.map((item) => (
              <tr key={item.description} className="border-b">
                <td className="py-2 text-sm">{item.description ?? 'Unknown'}</td>
                <td className="py-2 text-sm">{item.quantity}</td>
                <td className="py-2 text-sm">
                  {item.unit_price === 0 ? 'FREE' : `$${item.unit_price}`}
                </td>
                <td className="py-2 text-sm text-right">${item.amount}</td>
              </tr>
            ))}
          </tbody>

          {usageFees.length > 0 && (
            <Collapsible asChild open={showUsageFees} onOpenChange={setShowUsageFees}>
              <tbody>
                <Collapsible.Trigger asChild>
                  <tr className="border-b cursor-pointer" style={{ WebkitAppearance: 'initial' }}>
                    <td className="py-2 text-sm flex items-center space-x-2">
                      <Button
                        type="text"
                        className="!px-1"
                        icon={
                          <IconChevronRight
                            className={clsx('transition', showUsageFees && 'rotate-90')}
                          />
                        }
                      />
                      <p>Usage items</p>
                    </td>
                    <td />
                    <td />
                    <td className="text-sm text-right">
                      {!showUsageFees ? `$${totalUsageFees}` : null}
                    </td>
                  </tr>
                </Collapsible.Trigger>
                <Collapsible.Content asChild>
                  <>
                    {usageFees.map((fee) => (
                      <tr className="border-b" key={fee.description}>
                        <td className="py-2 text-sm pl-8">{fee.description}</td>
                        <td className="py-2 text-sm"></td>
                        <td className="py-2 text-sm">
                          {fee.unit_price ? `$${fee.unit_price}` : null}
                        </td>
                        <td className="py-2 text-sm text-right">${fee.amount ?? 0}</td>
                      </tr>
                    ))}
                  </>
                </Collapsible.Content>
              </tbody>
            </Collapsible>
          )}

          <tbody>
            <tr>
              <td className="py-2 text-sm">Total</td>
              <td className="py-2 text-sm" />
              <td className="py-2 text-sm" />
              <td className="py-2 text-sm text-right">${upcomingInvoice?.amount_total ?? 0}</td>
            </tr>
          </tbody>
        </table>
      )}
    </>
  )
}

export default UpcomingInvoice
