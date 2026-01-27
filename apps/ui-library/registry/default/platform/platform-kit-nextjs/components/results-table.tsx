'use client'

import { cn } from '@/lib/utils'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/registry/default/components/ui/table'

interface ResultsTableProps {
  data: any[]
  onRowClick?: (row: any) => void
}

export function ResultsTable({ data, onRowClick }: ResultsTableProps) {
  if (!data || data.length === 0) {
    return <p className="p-4 text-center">The query returned no results.</p>
  }

  const headers = Object.keys(data[0])

  return (
    <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {headers.map((header) => (
              <TableHead className="first:pl-6 lg:first:pl-8 last:pr-6 lg:last:pr-8" key={header}>
                {header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, rowIndex) => (
            <TableRow
              key={rowIndex}
              onClick={() => onRowClick?.(row)}
              className={cn(onRowClick && 'cursor-pointer hover:bg-muted/50 group')}
            >
              {headers.map((header) => (
                <TableCell
                  className="first:pl-6 lg:first:pl-8 last:pr-6 lg:last:pr-8 text-xs text-muted-foreground group-hover:text-foreground min-w-[8rem]"
                  key={`${rowIndex}-${header}`}
                >
                  <div className="text-xs font-mono w-fit max-w-96 truncate">
                    {JSON.stringify(row[header]).replace(/^"|"$/g, '')}
                  </div>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
