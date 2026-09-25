import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useMemo, useState } from 'react'
import { Button } from 'ui'

import { iso2ToCountryName } from '@/components/interfaces/Reports/utils/geo'
import type { GeographicUsageCountry } from '@/data/analytics/geographic-usage-query'

type CountryUsageRow = GeographicUsageCountry & { share: number }

export const CountryUsageTable = ({
  countries,
  totalRequests,
  selectedCode,
  onSelectCountry,
}: {
  countries: GeographicUsageCountry[]
  totalRequests: number
  selectedCode: string | undefined
  onSelectCountry: (code: string) => void
}) => {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'requests', desc: true }])
  const data = useMemo(
    () =>
      countries.map((country) => ({
        ...country,
        share: totalRequests > 0 ? Math.min(100, (country.requests / totalRequests) * 100) : 0,
      })),
    [countries, totalRequests]
  )
  const columns = useMemo<ColumnDef<CountryUsageRow>[]>(
    () => [
      {
        accessorFn: (row) => iso2ToCountryName(row.code),
        id: 'country',
        header: 'Country',
        cell: ({ row, getValue }) => (
          <Button
            type="button"
            variant="link"
            className="h-auto p-0 font-normal text-foreground"
            aria-pressed={row.original.code === selectedCode}
            onClick={() => onSelectCountry(row.original.code)}
          >
            {getValue<string>()}
          </Button>
        ),
      },
      {
        accessorKey: 'requests',
        header: 'Requests',
        cell: ({ row, getValue }) => (
          <div className="min-w-32 space-y-1.5">
            <span>{Number(getValue()).toLocaleString()}</span>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-300">
              <div
                className="h-full rounded-full bg-brand"
                style={{ width: `${row.original.share}%` }}
              />
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'share',
        header: 'Share',
        cell: ({ getValue }) => `${Number(getValue()).toFixed(1)}%`,
      },
      {
        accessorFn: (row) => row.change ?? undefined,
        id: 'change',
        header: 'Change',
        sortUndefined: 'last',
        cell: ({ getValue }) => {
          const change = getValue<number | undefined>()
          if (change === undefined) {
            return <span className="text-foreground-lighter">No prior data</span>
          }

          const direction = change >= 0 ? '↑' : '↓'
          const color = change >= 0 ? 'text-brand-600' : 'text-warning-600'
          return (
            <span className={color}>
              {direction} {Math.abs(change).toFixed(1)}%
            </span>
          )
        },
      },
    ],
    [onSelectCountry, selectedCode]
  )
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    getRowId: (row) => row.code,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="overflow-x-auto border-t">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="bg-surface-100 text-xs text-foreground-lighter">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const sorted = header.column.getIsSorted()
                let ariaSort: 'ascending' | 'descending' | 'none' = 'none'
                if (sorted === 'asc') ariaSort = 'ascending'
                if (sorted === 'desc') ariaSort = 'descending'

                return (
                  <th
                    key={header.id}
                    scope="col"
                    aria-sort={ariaSort}
                    className="px-4 py-3 font-medium"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 hover:text-foreground"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {sorted === 'asc' && <span aria-hidden="true">↑</span>}
                      {sorted === 'desc' && <span aria-hidden="true">↓</span>}
                    </button>
                  </th>
                )
              })}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const isSelected = row.original.code === selectedCode
            return (
              <tr
                key={row.id}
                aria-selected={isSelected}
                data-state={isSelected ? 'selected' : undefined}
                className="border-t hover:bg-surface-200 data-[state=selected]:bg-brand-200/30"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-4 py-3 align-middle">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
