import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Label_Shadcn_ as Label } from 'ui'
import type { DataTableInputFilterField } from '../DataTable.types'
import { useDebounce } from '../hooks/useDebounce'
import { InputWithAddons } from '../primitives/InputWithAddons'
import { useDataTable } from '../providers/DataTableProvider'

function getFilter(filterValue: unknown) {
  return typeof filterValue === 'string' ? filterValue : null
}

export function DataTableFilterInput<TData>({ value: _value }: DataTableInputFilterField<TData>) {
  const value = _value as string
  const { table, columnFilters } = useDataTable()
  const column = table.getColumn(value)
  const filterValue = columnFilters.find((i) => i.id === value)?.value
  const filters = getFilter(filterValue)
  const [input, setInput] = useState<string | null>(filters)

  const debouncedInput = useDebounce(input, 500)

  useEffect(() => {
    const newValue = debouncedInput?.trim() === '' ? null : debouncedInput
    if (debouncedInput === null) return
    column?.setFilterValue(newValue)
  }, [debouncedInput])

  useEffect(() => {
    if (debouncedInput?.trim() !== filters) {
      setInput(filters)
    }
  }, [filters])

  return (
    <div className="grid w-full gap-1.5">
      <Label htmlFor={value} className="sr-only px-2 text-muted-foreground">
        {value}
      </Label>
      <InputWithAddons
        placeholder="Search"
        leading={<Search className="h-4 w-4" />}
        containerClassName="h-9 rounded"
        name={value}
        id={value}
        value={input || ''}
        onChange={(e) => setInput(e.target.value)}
      />
    </div>
  )
}
