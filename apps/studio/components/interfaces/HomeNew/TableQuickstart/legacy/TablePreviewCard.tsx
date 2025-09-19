import { cn } from 'ui'
import {
  Database,
  Key,
  Hash,
  Calendar,
  Type,
  Binary,
  ToggleLeft,
  Braces,
  FileText,
} from 'lucide-react'
import type { TableField, TableSuggestion } from './types'

interface TablePreviewCardProps {
  table: TableSuggestion
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
}

const getFieldIcon = (field: TableField) => {
  // Always show primary key icon for 'id' fields or explicitly marked primary keys
  if (field.isPrimary || field.name === 'id') {
    return <Key size={10} className="text-brand" />
  }
  if (field.isForeign || field.name.endsWith('_id')) {
    return <Hash size={10} className="text-warning" />
  }

  switch (field.type) {
    case 'timestamp':
    case 'timestamptz':
    case 'date':
    case 'time':
    case 'timez':
      return <Calendar size={10} className="text-blue-800" />
    case 'text':
    case 'varchar':
      return <Type size={10} className="text-green-700" />
    case 'uuid':
      return <FileText size={10} className="text-purple-800" />
    case 'int2':
    case 'int4':
    case 'int8':
    case 'bigint':
    case 'float4':
    case 'float8':
    case 'numeric':
      return <Binary size={10} className="text-orange-800" />
    case 'bool':
      return <ToggleLeft size={10} className="text-cyan-800" />
    case 'json':
    case 'jsonb':
      return <Braces size={10} className="text-indigo-800" />
    case 'bytea':
      return <Binary size={10} className="text-gray-800" />
    default:
      return <Database size={10} className="text-foreground-lighter" />
  }
}

export const TablePreviewCard = ({ table, isActive, onClick, disabled }: TablePreviewCardProps) => {
  const displayFields = table.fields.slice(0, 7)
  const remainingCount = table.fields.length - displayFields.length

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group relative w-full text-left transition-all duration-300 rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-surface-100 transition-all duration-300 h-[240px] flex flex-col',
          isActive
            ? 'border-brand shadow-xl scale-[1.02]'
            : 'border-default hover:border-foreground-muted hover:shadow-lg hover:scale-[1.01]',
          !disabled && 'cursor-pointer'
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-surface-200 to-surface-100 px-4 py-3 border-b border-default flex-shrink-0">
          <div className="flex items-center gap-2 mb-1">
            <Database size={14} className="text-foreground-light" />
            <h4 className="font-mono text-sm font-medium text-foreground">{table.tableName}</h4>
          </div>
          {table.rationale && (
            <p className="text-xs text-foreground-lighter line-clamp-1">{table.rationale}</p>
          )}
        </div>

        {/* Fields */}
        <div className="flex-1 p-4 space-y-1.5 overflow-hidden relative">
          {displayFields.map((field, idx) => (
            <div
              key={field.name}
              className={cn(
                'flex items-center gap-2 text-xs transition-opacity duration-200',
                idx >= 6 && 'opacity-50'
              )}
            >
              <span className="flex-shrink-0">{getFieldIcon(field)}</span>
              <span className="flex-1 font-mono text-foreground truncate">{field.name}</span>
              <span className="text-[10px] font-mono text-foreground-lighter">{field.type}</span>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="absolute bottom-0 left-0 right-0 py-2 text-[11px] text-foreground-lighter text-center bg-gradient-to-t from-surface-100 via-surface-100 to-transparent">
              +{remainingCount} more {remainingCount === 1 ? 'field' : 'fields'}
            </div>
          )}
        </div>

        {/* Active indicator */}
        {isActive && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute inset-0 bg-brand/5" />
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-brand" />
          </div>
        )}
      </div>
    </button>
  )
}
