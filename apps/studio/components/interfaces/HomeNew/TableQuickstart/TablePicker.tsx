import { useState } from 'react'
import { TablePreviewCard } from './TablePreviewCard'
import { ArrowRight } from 'lucide-react'
import { cn } from 'ui'
import type { TableSuggestion } from './types'

interface TablePickerProps {
  tables: readonly TableSuggestion[]
  onSelectTable: (table: TableSuggestion) => void
  loading?: boolean
}

export const TablePicker = ({ tables, onSelectTable, loading }: TablePickerProps) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const handleSelectTable = (index: number) => {
    setSelectedIndex(index)
    setTimeout(() => {
      onSelectTable(tables[index])
    }, 150)
  }

  if (tables.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tables.map((table, index) => (
          <div
            key={table.tableName}
            className={cn(
              'relative transition-all duration-300',
              selectedIndex === index && 'scale-[0.98]'
            )}
          >
            <TablePreviewCard
              table={table}
              isActive={selectedIndex === index}
              onClick={() => handleSelectTable(index)}
              disabled={loading}
            />
          </div>
        ))}
      </div>

      {selectedIndex !== null && (
        <div className="flex items-center justify-center gap-2 text-sm text-foreground-light animate-pulse">
          <span>Creating table</span>
          <ArrowRight size={14} className="animate-pulse" />
        </div>
      )}
    </div>
  )
}
