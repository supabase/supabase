import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { FOREIGN_KEY_CASCADE_ACTION } from '@supabase/pg-meta'
import { ArrowRight, Key, Lightbulb, Link, Lock } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import {
  useColumnHasIndexSuggestion,
  useTableIndexAdvisor,
} from '../../context/TableIndexAdvisorContext'
import type { ColumnHeaderProps, ColumnType, GridForeignKey } from '../../types'
import { ColumnMenu } from '../menu/ColumnMenu'
import { getColumnFormat } from './ColumnHeader.utils'
import { getForeignKeyCascadeAction } from '@/components/interfaces/TableGridEditor/SidePanelEditor/ColumnEditor/ColumnEditor.utils'

export function ColumnHeader<R>({
  column,
  columnType,
  isPrimaryKey,
  isEncrypted,
  format,
  foreignKey,
  comment,
}: ColumnHeaderProps<R>) {
  const columnFormat = getColumnFormat(columnType, format)
  const hasIndexSuggestion = useColumnHasIndexSuggestion(column.name as string)
  const { openSheet } = useTableIndexAdvisor()

  const cursor = column.frozen ? 'sb-grid-column-header--cursor' : ''
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: column.key,
    disabled: column.frozen,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  } as const

  return (
    <div ref={setNodeRef} style={style} className="w-full bg-surface-200">
      <div className={`sb-grid-column-header ${cursor}`}>
        <div className="sb-grid-column-header__inner flex-grow" {...attributes} {...listeners}>
          <ColumnIcon type={columnType} name={column.name as string} foreignKey={foreignKey} />
          {isPrimaryKey && (
            <Tooltip>
              <TooltipTrigger>
                <div className="sb-grid-column-header__inner__primary-key">
                  <Key size={14} strokeWidth={2} />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Primary key
              </TooltipContent>
            </Tooltip>
          )}

          <Tooltip>
            <TooltipTrigger>
              <span className="sb-grid-column-header__inner__name">{column.name}</span>
            </TooltipTrigger>
            {!!comment && (
              <TooltipContent side="bottom" className="max-w-xs text-center">
                {comment}
              </TooltipContent>
            )}
          </Tooltip>

          <span className="sb-grid-column-header__inner__format">
            {columnFormat}
            {columnFormat === 'bytea' ? ` (hex)` : ''}
          </span>
          {isEncrypted && (
            <Tooltip>
              <TooltipTrigger>
                <Lock size={14} strokeWidth={2} />
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Encrypted column
              </TooltipContent>
            </Tooltip>
          )}
          {hasIndexSuggestion && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  className="flex items-center"
                  onClick={() => openSheet(column.name as string)}
                >
                  <span className="sr-only">View {column.name} index suggestion</span>
                  <Lightbulb size={14} strokeWidth={2} className="!text-warning" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="font-normal">
                Index might improve performance. Click for details.
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <ColumnMenu column={column} isEncrypted={isEncrypted} />
      </div>
    </div>
  )
}

function ColumnIcon({
  type,
  name,
  foreignKey,
}: {
  type: ColumnType
  name?: string
  foreignKey?: GridForeignKey
}) {
  switch (type) {
    case 'foreign_key':
      // [Joshen] Look into this separately but this should be a hover card instead
      return (
        <Tooltip>
          <TooltipTrigger>
            <Link size={14} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <div className="font-normal">
              <p className="text-xs text-foreground-light">Foreign key relation:</p>
              <div className="flex items-center space-x-1">
                <p className="text-xs !text-foreground">{name}</p>
                <ArrowRight size={14} strokeWidth={1.5} className="!text-foreground-light" />
                <p className="text-xs !text-foreground">
                  {foreignKey?.targetTableSchema}.{foreignKey?.targetTableName}.
                  {foreignKey?.targetColumnName}
                </p>
              </div>
              {foreignKey?.updateAction !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                <p className="text-xs !text-foreground mt-1">
                  On update: {getForeignKeyCascadeAction(foreignKey?.updateAction)}
                </p>
              )}
              {foreignKey?.deletionAction !== FOREIGN_KEY_CASCADE_ACTION.NO_ACTION && (
                <p className="text-xs !text-foreground mt-1">
                  On delete: {getForeignKeyCascadeAction(foreignKey?.deletionAction)}
                </p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      )
    default:
      return null
  }
}
