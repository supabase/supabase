import { ShimmeringLoader } from 'ui-patterns/ShimmeringLoader'
import type { DataTableColumn } from './types'

interface DataTableLoadingProps {
  columns: DataTableColumn[]
  compact?: boolean
  selectable?: boolean
  numRows?: number
}

export function DataTableLoading({
  columns,
  compact = false,
  selectable = false,
  numRows = 8,
}: DataTableLoadingProps) {
  const rowHeight = compact ? 'h-7' : 'h-[35px]'

  return (
    <div className="w-full">
      {Array.from({ length: numRows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={`flex items-center gap-0 border-b border-border px-0 ${rowHeight}`}
        >
          {selectable && (
            <div className="flex w-10 shrink-0 items-center justify-center px-2">
              <div className="h-3.5 w-3.5 rounded bg-surface-300" />
            </div>
          )}
          {columns.map((col, colIdx) => (
            <div
              key={col.id}
              className="flex items-center px-2 overflow-hidden"
              style={{ width: col.width ?? 160, minWidth: col.minWidth ?? 80 }}
            >
              <ShimmeringLoader
                className="h-3 rounded"
                style={{
                  width: `${60 + ((rowIdx * 13 + colIdx * 7) % 35)}%`,
                  animationDelay: `${(rowIdx * 100 + colIdx * 40) % 500}ms`,
                }}
              />
            </div>
          ))}
          {/* row actions placeholder */}
          <div className="w-8 shrink-0" />
        </div>
      ))}
    </div>
  )
}
