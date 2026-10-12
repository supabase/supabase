import type { Table } from '@tanstack/react-table'
import { ChevronDown } from 'lucide-react'
import { Button, Collapsible, CollapsibleContent, CollapsibleTrigger } from 'ui'

import { LogFieldRow } from './LogFieldRow'
import type { DataTableFilterField } from '@/components/ui/DataTable/DataTable.types'

export function LogFields<TData>({
  data,
  table,
  filterFields = [],
}: {
  data: unknown
  table?: Table<TData>
  filterFields?: DataTableFilterField<TData>[]
}) {
  if (Array.isArray(data)) {
    return (
      <span className="block min-w-0 truncate font-mono text-sm leading-5">
        {JSON.stringify(data)}
      </span>
    )
  }

  if (data === null || typeof data !== 'object' || data instanceof Date) {
    const value = data instanceof Date ? data.toISOString() : String(data)
    return (
      <span className="min-w-0 whitespace-pre-wrap break-all font-mono text-sm leading-5">
        {value}
      </span>
    )
  }

  const entries = Object.entries(data).filter(([, value]) => value !== undefined)
  if (entries.length === 0) {
    return <span className="font-mono text-sm leading-5">{'{}'}</span>
  }

  return (
    <div className="min-w-0">
      {entries.map(([key, value]) => {
        const isNested =
          value !== null &&
          typeof value === 'object' &&
          !(value instanceof Date) &&
          !Array.isArray(value)
        const serializableValue = value instanceof Date ? value.toISOString() : value
        const copyValue =
          typeof serializableValue === 'object'
            ? JSON.stringify(serializableValue, null, 2)
            : String(serializableValue)
        const field = filterFields.find((field) => field.value === key)
        const row = (
          <LogFieldRow
            label={key}
            value={copyValue}
            fieldValue={
              !isNested && !Array.isArray(value) && value !== null && value !== ''
                ? field?.value
                : undefined
            }
            filterFields={filterFields}
            table={table}
          >
            {isNested ? (
              <span className="font-mono text-sm leading-5 text-foreground-lighter">
                {Object.keys(value).length}
              </span>
            ) : (
              <LogFields data={value} />
            )}
          </LogFieldRow>
        )
        if (!isNested)
          return (
            <div key={key} className="flex">
              {row}
            </div>
          )

        return (
          <Collapsible key={key}>
            <div className="flex items-center">
              <CollapsibleTrigger asChild>
                <Button
                  variant="text"
                  className="px-1 [&[data-state=open]_svg]:rotate-180"
                  icon={<ChevronDown size={12} />}
                  aria-label={`Expand ${key}`}
                />
              </CollapsibleTrigger>
              {row}
            </div>
            <CollapsibleContent className="ml-3 border-l pl-3">
              <LogFields data={value} />
            </CollapsibleContent>
          </Collapsible>
        )
      })}
    </div>
  )
}
