import { cn } from 'ui'
import type { TableField, TableSuggestion } from './types'

interface TablePreviewCardProps {
  table: TableSuggestion
  isActive?: boolean
  onClick?: () => void
  disabled?: boolean
}

export const TablePreviewCard = ({ table, isActive, onClick, disabled }: TablePreviewCardProps) => {
  const displayFields = table.fields.slice(0, 5)

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200 hover:scale-[1.02] h-full flex flex-col',
        isActive && 'scale-[1.02]',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      onClick={disabled ? undefined : onClick}
    >
      <div
        className={cn(
          'w-full h-[180px] bg-surface-100 border-2 rounded-lg overflow-hidden flex flex-col',
          isActive ? 'border-primary shadow-lg' : 'border-default hover:border-primary/50'
        )}
      >
        <div className="bg-surface-200 px-3 py-2 border-b-2 border-default flex-shrink-0">
          <h4 className="font-mono font-semibold text-xs">{table.tableName}</h4>
        </div>

        <div className="relative flex-1 overflow-hidden">
          <div className="px-3 py-2 space-y-1.5">
            {displayFields.map((field, idx) => (
              <div
                key={field.name}
                className={cn(
                  'flex items-center justify-between text-[10px] font-mono gap-2',
                  idx >= 3 && 'opacity-60',
                  idx >= 4 && 'opacity-30'
                )}
              >
                <span className="text-foreground truncate">{field.name}</span>
                <span className="text-foreground-light text-[9px] truncate">{field.type}</span>
              </div>
            ))}
          </div>

          {/* Gradient fade for remaining fields */}
          {table.fields.length > 5 && (
            <>
              <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-surface-100 to-transparent pointer-events-none" />
              <div className="absolute bottom-0 left-0 right-0 text-center pb-2 text-[10px] text-foreground-light">
                +{table.fields.length - 5} more fields
              </div>
            </>
          )}
        </div>
      </div>

      <div className="h-[50px] mt-2 px-1">
        {table.rationale && (
          <p className="text-xs text-muted-foreground line-clamp-2">{table.rationale}</p>
        )}
      </div>
    </div>
  )
}
