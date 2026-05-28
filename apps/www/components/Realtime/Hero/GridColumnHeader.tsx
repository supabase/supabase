import { ChevronDown, Key } from 'lucide-react'

type GridColumnHeaderProps = {
  name: string
  format: string
  isPrimaryKey?: boolean
}

export function GridColumnHeader({ name, format, isPrimaryKey }: GridColumnHeaderProps) {
  return (
    <div className="w-full bg-surface-200">
      <div className="sb-grid-column-header">
        <div className="sb-grid-column-header__inner grow">
          {isPrimaryKey && (
            <div className="sb-grid-column-header__inner__primary-key">
              <Key size={14} strokeWidth={2} />
            </div>
          )}
          <span className="sb-grid-column-header__inner__name">{name}</span>
          <span className="sb-grid-column-header__inner__format">{format}</span>
        </div>
        <ChevronDown size={14} className="text-foreground-lighter shrink-0 opacity-50" />
      </div>
    </div>
  )
}
