import { useParams } from 'common'
import { Settings2 } from 'lucide-react'
import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { useTableColumnVisibility } from 'components/grid/hooks/useTableColumnVisibility'
import { useTableEditorTableStateSnapshot } from 'state/table-editor-table'

export const ColumnVisibility = () => {
  const snap = useTableEditorTableStateSnapshot()

  const { hiddenColumns, hideColumn, showColumn } = useTableColumnVisibility()

  const handleToggleColumnVisibility = (columnKey: string, isVisible: boolean) => {
    if (isVisible) {
      showColumn(columnKey)
    } else {
      hideColumn(columnKey)
    }
  }

  const columns = snap.table?.columns ?? []

  if (columns.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              type="text"
              icon={<Settings2 size={14} strokeWidth={1.5} />}
              className="rounded px-1.5"
            />
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">Show/hide columns</TooltipContent>
      </Tooltip>
      <DropdownMenuContent side="bottom" align="start" className="max-h-[300px] overflow-y-auto">
        {columns.map((column) => {
          const columnKey = column.name
          const isVisible = !hiddenColumns.has(columnKey)
          return (
            <DropdownMenuCheckboxItem
              key={columnKey}
              checked={isVisible}
              onSelect={(e) => e.preventDefault()}
              onCheckedChange={() => handleToggleColumnVisibility(columnKey, !isVisible)}
            >
              {column.name}
            </DropdownMenuCheckboxItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
