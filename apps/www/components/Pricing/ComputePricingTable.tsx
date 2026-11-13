import pricingAddOn from '~/data/PricingAddOnTable.json'
import Link from 'next/link'
import { Fragment, useMemo } from 'react'
import { Badge, cn } from 'ui'

import { isCrossZoneHref } from '@/lib/cross-zone'

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
        <table className="text-foreground m-0 hidden w-full table-auto border-separate border-spacing-0 overflow-hidden rounded-b lg:table text-xs">
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
            <tr>
              <td className="p-0 align-bottom">
                <span
                  className="relative block w-fit rounded-t-lg bg-surface-200 px-3 pt-2 pb-1 text-foreground
                    after:absolute after:bottom-0 after:left-full after:size-2
                    after:inverted-corner"
                >
                  First instance free on paid plans
                </span>
              </td>
            </tr>
            {pricingAddOn.database.rows.map((row, i) => (
              <tr key={`row-${i}`} className={cn(i > 0 && i % 2 === 0 && 'bg-surface-100')}>
                {row.columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'p-3',
                      i === 0 && 'bg-surface-200 first:rounded-bl-lg last:rounded-r-lg'
                    )}
                    translate={column.key === 'pricing' ? 'no' : undefined}
                  >
                    {column.url ? (
                      isCrossZoneHref(column.url) ? (
                        <a
                          href={column.url}
                          className="underline text-primary hover:text-brand-600"
                          target="_blank"
                        >
                          {column.value}
                        </a>
                      ) : (
                        <Link
                          href={column.url}
                          className="underline text-primary hover:text-brand-600"
                          target="_blank"
                        >
                          {column.value}
                        </Link>
                      )
                    ) : (
                      column.value
                    )}
                  </td>
                ))}
              </tr>
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
                      column.key === 'plan' ? 'text-primary pt-16 lg:pt-3' : ''
                    }`}
                  >
                    {column.key === 'plan' && i === 0 ? (
                      <span className="flex flex-wrap items-center gap-2">
                        {column.value}
                        <Badge variant="success">First instance free on paid plans</Badge>
                      </span>
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
