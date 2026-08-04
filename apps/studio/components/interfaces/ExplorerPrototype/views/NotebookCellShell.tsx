/**
 * PROTOTYPE — the notebook's wrapper around a cell.
 *
 * Reorder / delete / insert are properties of the *notebook*, not of the cell,
 * so they live here in a left gutter rather than inside `QueryCell` or
 * `MarkdownCellView`. That keeps the cell components identical on every surface
 * (notebook, snippet, agent chat) and lets both cell kinds share one control
 * layout. Because nothing is stacked below a cell any more, the vertical gap
 * between cells can be tight.
 */

import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2 } from 'lucide-react'
import type { PropsWithChildren } from 'react'
import {
  Button,
  cn,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from 'ui'

interface NotebookCellShellProps {
  isFirst: boolean
  isLast: boolean
  /** Markdown stays at a readable measure; query cells fill the width. */
  contained?: boolean
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
  onAddCell: (type: 'query' | 'markdown') => void
}

const controlClassName = 'size-6 px-0 text-foreground-muted hover:text-foreground'

export const NotebookCellShell = ({
  isFirst,
  isLast,
  contained = false,
  onMoveUp,
  onMoveDown,
  onRemove,
  onAddCell,
  children,
}: PropsWithChildren<NotebookCellShellProps>) => (
  <div className="group/cell relative pl-8">
    <div
      className={cn(
        'absolute left-0 top-0 flex w-8 flex-col items-center gap-px pt-1',
        'opacity-0 transition-opacity group-hover/cell:opacity-100 focus-within:opacity-100'
      )}
    >
      <span
        aria-hidden
        className="flex size-6 cursor-grab items-center justify-center text-foreground-muted"
      >
        <GripVertical size={14} />
      </span>
      <Button
        variant="text"
        size="tiny"
        className={controlClassName}
        aria-label="Move cell up"
        disabled={isFirst}
        icon={<ChevronUp size={14} />}
        onClick={onMoveUp}
      />
      <Button
        variant="text"
        size="tiny"
        className={controlClassName}
        aria-label="Move cell down"
        disabled={isLast}
        icon={<ChevronDown size={14} />}
        onClick={onMoveDown}
      />
      <Button
        variant="text"
        size="tiny"
        className={controlClassName}
        aria-label="Delete cell"
        icon={<Trash2 size={14} />}
        onClick={onRemove}
      />
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
        <DropdownMenuContent align="start" side="right">
          <DropdownMenuItem onClick={() => onAddCell('query')}>Query cell</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onAddCell('markdown')}>Markdown cell</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>

    <div className={cn(contained && 'mx-auto w-full max-w-3xl')}>{children}</div>
  </div>
)
