import { RLSPlaygroundTable } from 'data/rls-playground'
import { cn, Input, Badge, ScrollArea } from 'ui'
import { Table2, ShieldCheck, ShieldAlert, Search } from 'lucide-react'
import { useState, useMemo } from 'react'

interface RLSTableSelectorProps {
  tables: RLSPlaygroundTable[]
  selectedTable: string | null
  onSelectTable: (table: string | null) => void
  isLoading: boolean
}

export const RLSTableSelector = ({
  tables,
  selectedTable,
  onSelectTable,
  isLoading,
}: RLSTableSelectorProps) => {
  const [search, setSearch] = useState('')

  const filteredTables = useMemo(() => {
    if (!search) return tables
    return tables.filter((t) =>
      t.name.toLowerCase().includes(search.toLowerCase())
    )
  }, [tables, search])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[300px] text-foreground-lighter">
        Loading tables...
      </div>
    )
  }

  if (tables.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[300px] text-foreground-lighter gap-2">
        <Table2 className="h-8 w-8" />
        <p>No tables found in this schema</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-lighter" />
        <Input
          placeholder="Search tables..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table List */}
      <ScrollArea className="h-[250px]">
        <div className="flex flex-col gap-1">
          {filteredTables.map((table) => (
            <button
              key={table.id}
              onClick={() => onSelectTable(table.name)}
              className={cn(
                'flex items-center justify-between px-3 py-2 rounded-md text-left transition-colors',
                'hover:bg-surface-200',
                selectedTable === table.name
                  ? 'bg-surface-200 border border-foreground-muted'
                  : 'border border-transparent'
              )}
            >
              <div className="flex items-center gap-2">
                {table.rls_enabled ? (
                  <ShieldCheck className="h-4 w-4 text-brand" />
                ) : (
                  <ShieldAlert className="h-4 w-4 text-warning" />
                )}
                <span className="font-mono text-sm">{table.name}</span>
              </div>
              <div className="flex items-center gap-2">
                {table.policy_count > 0 && (
                  <Badge variant="default" className="text-xs">
                    {table.policy_count} {table.policy_count === 1 ? 'policy' : 'policies'}
                  </Badge>
                )}
                {!table.rls_enabled && (
                  <Badge variant="warning" className="text-xs">
                    No RLS
                  </Badge>
                )}
              </div>
            </button>
          ))}

          {filteredTables.length === 0 && search && (
            <div className="text-center py-8 text-foreground-lighter">
              No tables matching "{search}"
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Summary */}
      <div className="text-xs text-foreground-lighter border-t pt-2">
        {tables.filter((t) => t.rls_enabled).length} of {tables.length} tables have
        RLS enabled
      </div>
    </div>
  )
}
