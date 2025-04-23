import { isEqual } from 'lodash'
import { ChevronDown, List } from 'lucide-react'
import { useCallback, useMemo } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'

import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'
import type { Sort } from 'components/grid/types'
import { Button, PopoverSeparator_Shadcn_ } from 'ui'
import SortRow from './SortRow'
import { DropdownControl } from '../../common/DropdownControl'

export interface SortPopoverContentProps {
  sorts: Sort[]
  initialSorts: Sort[]
  onToggleSort: (column: string, ascending: boolean) => void
  onDeleteSort: (column: string) => void
  onDragSort: (dragIndex: number, hoverIndex: number) => void
  onAddSort: (columnName: string | number) => void
  onApplySorts: (sorts: Sort[]) => void
  providedBackend?: any
}

const SortPopoverContent = ({
  sorts,
  initialSorts,
  onToggleSort,
  onDeleteSort,
  onDragSort,
  onAddSort,
  onApplySorts,
  providedBackend,
}: SortPopoverContentProps) => {
  const snap = useTableEditorTableStateSnapshot()

  const columns = useMemo(() => {
    if (!snap?.table?.columns) return []
    return snap.table.columns.filter((x) => {
      if (x.dataType === 'json' || x.dataType === 'jsonb') return false
      const found = sorts.find((y) => y.column == x.name)
      return !found
    })
  }, [snap?.table?.columns, sorts])

  const dropdownOptions = useMemo(() => {
    return columns?.map((x) => ({ value: x.name, label: x.name })) || []
  }, [columns])

  const content = (
    <div className="space-y-2 py-2">
      {sorts.map((sort, index) => (
        <SortRow
          key={sort.column}
          index={index}
          columnName={sort.column}
          sort={sort}
          onDelete={onDeleteSort}
          onToggle={onToggleSort}
          onDrag={onDragSort}
        />
      ))}
      {sorts.length === 0 && (
        <div className="space-y-1 px-3">
          <h5 className="text-sm text-foreground-light">No sorts applied to this view</h5>
          <p className="text-xs text-foreground-lighter">Add a column below to sort the view</p>
        </div>
      )}

      <PopoverSeparator_Shadcn_ />
      <div className="px-3 flex flex-row justify-between">
        {columns && columns.length > 0 ? (
          <DropdownControl
            options={dropdownOptions}
            onSelect={onAddSort}
            side="bottom"
            align="start"
          >
            <Button
              asChild
              type="text"
              iconRight={<ChevronDown size="14" className="text-foreground-light" />}
              className="sb-grid-dropdown__item-trigger"
              data-testid="table-editor-pick-column-to-sort-button"
            >
              <span>Pick {sorts.length > 1 ? 'another' : 'a'} column to sort by</span>
            </Button>
          </DropdownControl>
        ) : (
          <p className="text-sm text-foreground-light">All columns have been added</p>
        )}
        <div className="flex items-center">
          <Button
            disabled={isEqual(sorts, initialSorts)}
            type="default"
            onClick={() => onApplySorts(sorts)}
          >
            Apply sorting
          </Button>
        </div>
      </div>
    </div>
  )

  // If providedBackend is passed, use that (for nested DndProvider contexts)
  if (providedBackend) {
    return content
  }

  return <DndProvider backend={HTML5Backend}>{content}</DndProvider>
}

export default SortPopoverContent
