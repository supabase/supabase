import { Key, Lightbulb, Link, Lock } from 'lucide-react'

import { useColumnHasIndexSuggestion } from '../../context/TableIndexAdvisorContext'
import { ColumnType, SupaColumn } from '../../types'
import { getColumnType } from '../../utils/gridColumns'
import { getColumnFormat } from './ColumnHeader.utils'

interface ColumnOverlayItemProps {
  column: SupaColumn
}

/*
 * Simplified version (without tooltip nor menus) of <ColumnHeader> that is used for drag & drop operations.
 * This is the item users will drag around.
 */
export function ColumnOverlayItem({ column }: ColumnOverlayItemProps) {
  const hasIndexSuggestion = useColumnHasIndexSuggestion(column.name as string)
  const columnType = getColumnType(column)
  const columnFormat = getColumnFormat(getColumnType(column), column.format)
  return (
    <div className="sb-grid-column-header bg-surface-200 opacity-75">
      <div className="sb-grid-column-header__inner">
        <ColumnIcon type={columnType} />
        {column.isPrimaryKey && (
          <div className="sb-grid-column-header__inner__primary-key">
            <Key size={14} strokeWidth={2} />
          </div>
        )}

        <span className="sb-grid-column-header__inner__name">{column.name}</span>

        <span className="sb-grid-column-header__inner__format">
          {columnFormat}
          {columnFormat === 'bytea' ? ` (hex)` : ''}
        </span>
        {column.isEncrypted && <Lock size={14} strokeWidth={2} />}
        {hasIndexSuggestion && <Lightbulb size={14} strokeWidth={2} className="!text-warning" />}
      </div>
    </div>
  )
}

function ColumnIcon({ type }: { type: ColumnType }) {
  switch (type) {
    case 'foreign_key':
      // [Joshen] Look into this separately but this should be a hover card instead
      return <Link size={14} strokeWidth={2} />
    default:
      return null
  }
}
