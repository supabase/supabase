import React, { Fragment, useMemo } from 'react'
import pricingAddOn from '~/data/PricingAddOnTable.json'
import { IconPricingIncludedCheck, IconPricingMinus } from './PricingIcons'
import { cn } from 'ui'

const ComputePricingTable = () => {
  const columnNames = useMemo(
    () =>
      pricingAddOn.database.rows.map((row) =>
        row.columns.map((column) => ({ key: column.key, title: column.title }))
      )[0],
    []
  )

  return (
    <>
      <div className="p-5">
        <table className="text-foreground m-0 hidden w-full table-auto overflow-hidden rounded-b lg:table text-xs">
          <thead>
            <tr>
              {columnNames.map((column) => (
                <th key={column.key} className="p-3 text-left font-medium">
                  {column.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pricingAddOn.database.rows.map((row, i) => (
              <Fragment key={`row-${i}`}>
                {i === 0 && (
                  <tr>
                    <td className="pb-1 bg-border-strong px-3 py-1 -mr-1 border-l-4 border-strong">
                      <span>First instance is free on paid plans</span>
                    </td>
                  </tr>
                )}
                <tr
                  key={i}
                  className={cn(
                    i % 2 === 0 ? 'bg-surface-100 rounded-lg' : '',
                    i === 0 ? 'border-4 border-strong' : ''
                  )}
                >
                  {row.columns.map((column) => (
                    <td key={column.key} className="p-3">
                      {column.key === 'dedicated' ? (
                        column.value ? (
                          <IconPricingIncludedCheck plan="Pro plan" />
                        ) : (
                          <IconPricingMinus plan="Free plan" />
                        )
                      ) : (
                        column.value
                      )}
                    </td>
                  ))}
                </tr>
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <table className="text-foreground m-0 -mt-20 lg:mt-0 w-full table-auto overflow-hidden rounded-b lg:hidden text-xs">
        <tbody>
          {pricingAddOn.database.rows.map((row, i) => (
            <Fragment key={i}>
              {row.columns.map((column) => (
                <tr key={column.key}>
                  <th
                    className={`py-3 pl-4 text-left font-medium ${
                      column.key === 'plan' ? 'pt-16 lg:pt-3' : ''
                    }`}
                  >
                    {column.title}
                  </th>
                  <td
                    className={`px-4 py-3 ${
                      column.key === 'plan' ? 'text-brand pt-16 lg:pt-3' : ''
                    }`}
                  >
                    {column.key === 'dedicated' ? (
                      column.value ? (
                        <IconPricingIncludedCheck plan="Pro plan" />
                      ) : (
                        <IconPricingMinus plan="Free plan" />
                      )
                    ) : (
                      column.value
                    )}
                  </td>
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </>
  )
}

export default ComputePricingTable
