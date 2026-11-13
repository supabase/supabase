import { DatabaseIcon, SquareTerminalIcon, Table2Icon } from 'lucide-react'
import type { ReactNode } from 'react'
import {
  Button,
  cn,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import type { TableSummary } from '../contract'
import type { Entity } from '../query/query-model'

/** A sidebar row: a table, or Run SQL. */
function NavRow({
  icon,
  label,
  isActive,
  onClick,
}: {
  icon: ReactNode
  label: string
  isActive: boolean
  onClick: () => void
}) {
  return (
    <button
      aria-current={isActive ? 'page' : undefined}
      onClick={onClick}
      className={cn(
        'flex h-8 w-full items-center gap-2 rounded-md px-2 text-left text-sm text-foreground-light hover:bg-surface-200 hover:text-foreground',
        isActive && 'bg-selection text-foreground'
      )}
    >
      <span aria-hidden="true" className="shrink-0 text-foreground-lighter">
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
    </button>
  )
}

function Caption({ children }: { children: ReactNode }) {
  return <p className="px-2 py-1.5 text-xs text-foreground-lighter">{children}</p>
}

function RetryAdmonition({
  title,
  error,
  onRetry,
}: {
  title: string
  error: string
  onRetry: () => void
}) {
  return (
    <Admonition
      type="warning"
      title={title}
      description={`Error: ${error}`}
      actions={
        <Button variant="default" size="tiny" onClick={onRetry}>
          Retry
        </Button>
      }
    />
  )
}

export interface ExplorerSidebarProps {
  schema: string
  schemas: string[]
  tables: TableSummary[]
  search: string
  onSearchChange: (value: string) => void
  /** The table shown on the right, if any. */
  activeTable?: string
  isQueryActive: boolean
  canWriteSql: boolean
  isSchemaLoading: boolean
  isTableLoading: boolean
  schemaError: string
  tableError: string
  onSelectSchema: (schema: string) => void
  onOpenTable: (entity: Entity) => void
  onOpenSql: () => void
  onRetry: () => void
}

/** Schema, search and the schema's tables, with Run SQL at the bottom. */
export function ExplorerSidebar({
  schema,
  schemas,
  tables,
  search,
  onSearchChange,
  activeTable,
  isQueryActive,
  canWriteSql,
  isSchemaLoading,
  isTableLoading,
  schemaError,
  tableError,
  onSelectSchema,
  onOpenTable,
  onOpenSql,
  onRetry,
}: ExplorerSidebarProps) {
  const filtered = tables.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
  // Keep the selected schema visible during refreshes and for deep links.
  const options = schemas.includes(schema) ? schemas : [schema, ...schemas]
  return (
    <aside
      aria-label="Database"
      className="flex w-60 shrink-0 flex-col gap-2 border-r bg-surface-75 p-2"
    >
      <Select value={schema} onValueChange={onSelectSchema} disabled={isSchemaLoading}>
        <SelectTrigger size="tiny" aria-label="Schema" className="w-full gap-1.5">
          <DatabaseIcon size={13} aria-hidden="true" className="shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((name) => (
            <SelectItem key={name} value={name} className="text-xs">
              {name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        size="tiny"
        aria-label={`Search ${schema} tables`}
        placeholder="Search tables"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <nav className="-mx-2 min-h-0 flex-1 overflow-auto px-2" aria-label="Tables">
        {filtered.map((table) => (
          <NavRow
            key={table.name}
            icon={<Table2Icon size={15} />}
            label={table.name}
            isActive={activeTable === table.name}
            onClick={() => onOpenTable({ schema, name: table.name })}
          />
        ))}
        {isTableLoading && <Caption>Loading…</Caption>}
        {!isTableLoading && !tableError && filtered.length === 0 && (
          <Caption>{search ? 'No matching tables' : 'No tables in this schema'}</Caption>
        )}
      </nav>
      {schemaError && (
        <RetryAdmonition title="Failed to load schemas" error={schemaError} onRetry={onRetry} />
      )}
      {tableError && (
        <RetryAdmonition title="Failed to load tables" error={tableError} onRetry={onRetry} />
      )}
      {canWriteSql && (
        <div className="-mx-2 border-t px-2 pt-2">
          <NavRow
            icon={<SquareTerminalIcon size={15} />}
            label="Run SQL"
            isActive={isQueryActive}
            onClick={onOpenSql}
          />
        </div>
      )}
    </aside>
  )
}
