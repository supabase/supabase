import { useState } from 'react'
import { TablePreviewCard } from './TablePreviewCard'
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
    onSelectTable(tables[index])
  }

  if (tables.length === 0) return null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch">
        {tables.map((table, index) => (
          <div key={table.tableName} className="relative h-full">
            <TablePreviewCard
              table={table}
              isActive={selectedIndex === index}
              onClick={() => handleSelectTable(index)}
              disabled={loading}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
