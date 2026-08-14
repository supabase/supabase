/**
 * PROTOTYPE — the notebook's wrapper around a cell.
 *
 * Reorder / delete / insert are properties of the *notebook*, not of the cell,
 * so they live here in a left gutter rather than inside `QueryCell` or
 * `MarkdownCellView`. That keeps the cell components identical on every surface
 * (notebook, agent chat) and lets both cell kinds share one control
 * layout. The horizontal plus + drag affordances mirror notebook editors: the
 * drag button opens the block menu on click and remains the native drag handle.
 */

import {
  ChevronDown,
  ChevronUp,
  FileText,
  GripVertical,
  Plus,
  SquareCode,
  Trash2,
} from 'lucide-react'
import type { PropsWithChildren } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'ui'

interface NotebookCellShellProps {
  cellId: string
  isFirst: boolean
  isLast: boolean
  /** Markdown stays at a readable measure; query cells fill the width. */
  contained?: boolean
  /** Embedded notebook previews share the layout but not editing controls. */
  readOnly?: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onMoveTo: (cellId: string, placement: 'before' | 'after') => void
  onRemove: () => void
  onAddCell: (type: 'query' | 'markdown') => void
}

const controlClassName = 'size-6 px-0 text-foreground-muted hover:text-foreground'

export const NotebookCellShell = ({
  cellId,
  isFirst,
  isLast,
  contained = false,
  readOnly = false,
  onMoveUp,
  onMoveDown,
  onMoveTo,
  onRemove,
  onAddCell,
  children,
}: PropsWithChildren<NotebookCellShellProps>) => {
  if (readOnly) {
    return <div className={cn(contained && 'mx-auto my-4 w-full max-w-3xl')}>{children}</div>
  }

  return (
    <div
      className={cn('group/cell relative pl-14', contained && 'my-4')}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        const draggedCellId = event.dataTransfer.getData('application/x-explorer-notebook-cell')
        if (!draggedCellId || draggedCellId === cellId) return

        const bounds = event.currentTarget.getBoundingClientRect()
        onMoveTo(draggedCellId, event.clientY - bounds.top > bounds.height / 2 ? 'after' : 'before')
      }}
    >
      <div
        className={cn(
          'absolute left-0 top-0 flex items-center gap-px pt-2.5',
          'opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100'
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="text"
              size="tiny"
              className={controlClassName}
              aria-label="Add cell below"
              icon={<Plus size={14} />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-40">
            <DropdownMenuItem className="gap-x-2" onClick={() => onAddCell('query')}>
              <SquareCode size={14} strokeWidth={1.5} />
              Query cell
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2" onClick={() => onAddCell('markdown')}>
              <FileText size={14} strokeWidth={1.5} />
              Markdown cell
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="text"
              size="tiny"
              className={cn(controlClassName, 'cursor-grab active:cursor-grabbing')}
              aria-label="Block actions"
              draggable
              icon={<GripVertical size={14} />}
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('application/x-explorer-notebook-cell', cellId)
              }}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="right" className="w-36">
            <DropdownMenuItem className="gap-x-2" disabled={isFirst} onClick={onMoveUp}>
              <ChevronUp size={14} strokeWidth={1.5} />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-x-2" disabled={isLast} onClick={onMoveDown}>
              <ChevronDown size={14} strokeWidth={1.5} />
              Move down
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="gap-x-2 text-destructive" onClick={onRemove}>
              <Trash2 size={14} strokeWidth={1.5} />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className={cn(contained && 'mx-auto w-full max-w-3xl')}>{children}</div>
    </div>
  )
}
