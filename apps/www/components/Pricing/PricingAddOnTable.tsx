import { Collapsible, IconChevronUp } from 'ui'
import classNames from 'classnames'
import { Fragment, useMemo, useState } from 'react'
import { Check } from './PricingIcons'

interface PricingAddOnTableProps {
  pricing: {
    title: string
    features: string[]
    rows: {
      columns: {
        key: string
        title: string
        value: string
      }[]
    }[]
  }
  icon: JSX.Element
}

const PricingAddOnTable = ({ icon, pricing }: PricingAddOnTableProps) => {
  const [isAddOnOpen, setIsAddOnOpen] = useState(false)

  const columnNames = useMemo(
    () =>
      pricing.rows.map((row) =>
        row.columns.map((column) => ({ key: column.key, title: column.title }))
      )[0],
    [pricing]
  )

  return (
    <div className="group overflow-hidden rounded-md shadow-md transition duration-500 hover:shadow-lg">
      <Collapsible open={isAddOnOpen} onOpenChange={setIsAddOnOpen}>
        <Collapsible.Trigger asChild>
          <button
            className={classNames(
              'text-foreground bg-blue-500 border border-overlay group flex w-full flex-col items-start rounded-t-md lg:flex-row lg:items-center',
              !isAddOnOpen && 'rounded-b-md'
            )}
            type="button"
          >
            <div className="flex w-full flex-1 flex-col items-start lg:w-auto lg:flex-row lg:items-center">
              <div className="bg-surface-100 relative flex w-full items-center space-x-3 self-stretch py-8 pl-4 lg:w-[420px] lg:py-0">
                <span className="bg-foreground text-background rounded-md p-2 shadow-sm transition-transform duration-500 group-hover:scale-105 group-hover:shadow">
                  {icon}
                </span>
                <span className="flex-shrink-0">
                  See <strong className="font-medium">{pricing.title}</strong> add-on plans
                </span>
              </div>

              <div className="border-muted flex flex-1 items-center justify-between lg:border-l">
                <div className="grid-flow-rows grid grid-cols-1 gap-y-3 gap-x-6 px-3 py-6 lg:grid-cols-2">
                  {pricing.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Check />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-center p-3">
              <IconChevronUp className="data-open-parent:rotate-0 data-closed-parent:rotate-180 h-8 w-8 transition" />
            </div>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div>
            <table className="text-foreground m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table">
              <thead>
                <tr className="bg-surface-300">
                  {columnNames.map((column) => (
                    <th key={column.key} className="p-3 text-left font-medium">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.rows.map((row, i) => (
                  <tr key={i} className={classNames(i % 2 === 0 && 'bg-surface-100')}>
                    {row.columns.map((column) => (
                      <td key={column.key} className="p-3">
                        {column.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="text-foreground m-0 w-full table-auto overflow-hidden rounded-b lg:hidden">
              <tbody>
                {pricing.rows.map((row, i) => (
                  <Fragment key={i}>
                    {row.columns.map((column) => (
                      <tr key={column.key} className={classNames(i % 2 === 0 && 'bg-surface-100')}>
                        <th className="py-3 pl-4 text-left font-medium">{column.title}</th>
                        <td className="px-4 py-3">{column.value}</td>
                      </tr>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </Collapsible.Content>
      </Collapsible>
    </div>
  )
}

export default PricingAddOnTable
