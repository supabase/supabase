import { cn } from 'ui'
import { Database, Key, Hash, Calendar, Type, Binary } from 'lucide-react'
import type { TableField, TableSuggestion } from './types'

interface TablePreviewCardProps {
  table: TableSuggestion
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
}

const getFieldIcon = (field: TableField) => {
  if (field.isPrimary) return <Key size={10} className="text-brand" />
  if (field.isForeign) return <Hash size={10} className="text-warning" />

  switch (field.type) {
    case 'timestamp':
    case 'timestamptz':
    case 'date':
    case 'time':
      return <Calendar size={10} className="text-foreground-lighter" />
    case 'text':
    case 'varchar':
      return <Type size={10} className="text-foreground-lighter" />
    case 'uuid':
    case 'int2':
    case 'int4':
    case 'int8':
    case 'bigint':
      return <Binary size={10} className="text-foreground-lighter" />
    default:
      return <Database size={10} className="text-foreground-lighter" />
  }
}

export const TablePreviewCard = ({ table, isActive, onClick, disabled }: TablePreviewCardProps) => {
  const displayFields = table.fields.slice(0, 6)
  const remainingCount = table.fields.length - displayFields.length

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'group relative w-full text-left transition-all duration-300',
        'focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 focus:ring-offset-background',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <div
        className={cn(
          'relative overflow-hidden rounded-xl border bg-surface-100 transition-all duration-300',
          isActive
            ? 'border-brand shadow-xl scale-[1.02]'
            : 'border-default hover:border-foreground/20 hover:shadow-lg hover:scale-[1.01]',
          !disabled && 'cursor-pointer'
        )}
      >
        {/* Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-surface-200 to-surface-100 px-4 py-3 border-b border-default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database size={14} className="text-foreground-light" />
              <h4 className="font-mono text-sm font-medium text-foreground">
                {table.tableName}
              </h4>
            </div>
            {table.source === 'ai' && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                AI
              </span>
            )}
          </div>
        </div>

        {/* Fields */}
        <div className="p-4 space-y-2">
          {displayFields.map((field, idx) => (
            <div
              key={field.name}
              className={cn(
                'flex items-center gap-2 text-xs transition-opacity duration-200',
                idx >= 4 && 'opacity-60'
              )}
            >
              <span className="flex-shrink-0">
                {getFieldIcon(field)}
              </span>
              <span className="flex-1 font-mono text-foreground truncate">
                {field.name}
              </span>
              <span className="text-[10px] font-mono text-foreground-lighter">
                {field.type}
              </span>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="pt-2 text-[11px] text-foreground-lighter text-center">
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

      {/* Description */}
      {table.rationale && (
        <p className="mt-3 px-1 text-xs text-foreground-light line-clamp-2 group-hover:text-foreground-default transition-colors">
          {table.rationale}
        </p>
      )}
    </button>
  )
}
