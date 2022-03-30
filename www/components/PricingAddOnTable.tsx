import { Collapsible, IconChevronUp } from '@supabase/ui'
import classNames from 'classnames'
import { Fragment, useMemo, useState } from 'react'
import { Check } from './PricingTableRow'

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
    <div className="overflow-hidden transition duration-500 rounded-md shadow-md hover:shadow-lg group">
      <Collapsible open={isAddOnOpen} onOpenChange={setIsAddOnOpen}>
        <Collapsible.Trigger asChild>
          <button
            className={classNames(
              'flex flex-col items-start lg:flex-row lg:items-center w-full rounded-t-md group text-scale-1200 bg-scale-100 dark:bg-scale-200 dark:border border-scale-300',
              !isAddOnOpen && 'rounded-b-md'
            )}
            type="button"
          >
            <div className="flex flex-col items-start flex-1 w-full lg:w-auto lg:items-center lg:flex-row">
              <div className="relative flex items-center self-stretch w-full py-8 pl-4 space-x-3 bg-white dark:bg-scale-300 lg:py-0 lg:w-72">
                <span className="p-2 transition-transform duration-500 rounded-md shadow-sm group-hover:scale-105 bg-scale-1200 text-scale-100 group-hover:shadow">
                  {icon}
                </span>
                <span className="flex-shrink-0">
                  See <strong className="font-medium">{pricing.title}</strong> add-on plans
                </span>
              </div>

              <div className="flex items-center justify-between flex-1 lg:border-l border-scale-500 dark:border-scale-400">
                <div className="grid grid-cols-1 px-3 py-6 gap-y-3 gap-x-6 grid-flow-rows lg:grid-cols-2">
                  {pricing.features.map((feature, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Check />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center self-center gap-2 p-3">
              <IconChevronUp className="w-8 h-8 transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
            </div>
          </button>
        </Collapsible.Trigger>

        <Collapsible.Content>
          <div>
            <table className="hidden w-full m-0 overflow-hidden rounded-b table-auto text-scale-1200 lg:table">
              <thead>
                <tr className="bg-scale-500">
                  {columnNames.map((column) => (
                    <th key={column.key} className="p-3 font-medium text-left">
                      {column.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pricing.rows.map((row, i) => (
                  <tr key={i} className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                    {row.columns.map((column) => (
                      <td key={column.key} className="p-3">
                        {column.value}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <table className="w-full m-0 overflow-hidden rounded-b table-auto text-scale-1200 lg:hidden">
              <tbody>
                {pricing.rows.map((row, i) => (
                  <Fragment key={i}>
                    {row.columns.map((column) => (
                      <tr key={column.key} className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                        <th className="py-3 pl-4 font-medium text-left">{column.title}</th>
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
