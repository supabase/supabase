import { Undo2Icon } from 'lucide-react'

import { DetailsList, DetailsListItem } from '../Details/DetailsSection'
import type { QueryResultEditing } from './useQueryResultEditing'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { formatCellValue } from '@/components/ui/DataGridResults/DataGridResults.utils'

const formatRowIdentifiers = (rowIdentifiers: Record<string, unknown>) =>
  Object.entries(rowIdentifiers)
    .map(([column, value]) => `${column} = ${formatCellValue(value)}`)
    .join(', ')

/**
 * Sidebar view of a result's unsaved edits, each with what it changes and a way to take it
 * back. Saving and discarding stay in the edits bar under the results.
 */
export const PendingChangesPanel = ({ editing }: { editing: QueryResultEditing }) => (
  <aside aria-label="Pending changes" className="flex h-full flex-col overflow-y-auto">
    <div className="flex flex-col gap-y-2 p-4">
      <h3 className="flex h-8 items-center gap-x-1.5 heading-meta text-foreground-lighter">
        <span>Pending changes</span>
        <span className="text-foreground-muted">{editing.pendingEdits.length}</span>
      </h3>
      <DetailsList>
        {editing.pendingEdits.map((edit) => (
          <DetailsListItem
            key={`${edit.table.id}:${JSON.stringify(edit.rowIdentifiers)}:${edit.columnName}`}
            title={
              <>
                <span className="font-mono">{edit.columnName}</span>
                <span className="text-foreground-lighter">
                  {' '}
                  on {edit.table.name} where {formatRowIdentifiers(edit.rowIdentifiers)}
                </span>
              </>
            }
            description={
              <>
                <span className="line-through">{formatCellValue(edit.oldValue)}</span>
                {' → '}
                <span className="text-foreground">{formatCellValue(edit.newValue)}</span>
              </>
            }
            action={
              <ButtonTooltip
                variant="text"
                size="tiny"
                className="h-6 w-6 shrink-0 px-0 opacity-0 transition-opacity group-hover/item:opacity-100 focus-visible:opacity-100"
                icon={<Undo2Icon size={14} />}
                aria-label="Revert change"
                disabled={editing.isSaving}
                tooltip={{ content: { side: 'left', text: 'Revert change' } }}
                onClick={() => editing.revertEdit(edit)}
              />
            }
          />
        ))}
      </DetailsList>
    </div>
  </aside>
)
