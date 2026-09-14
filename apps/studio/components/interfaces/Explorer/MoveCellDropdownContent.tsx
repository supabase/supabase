import { ArrowDown, ArrowUp, Trash } from 'lucide-react'
import { DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from 'ui'

import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface MoveCellDropdownContentProps {
  cellId: string
}

export const MoveCellDropdownContent = ({ cellId }: MoveCellDropdownContentProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const cells = currentNotebook?.notebook.content?.cells ?? []
  const currentIndex = cells.findIndex((c) => c._id === cellId)
  const isFirstCell = currentIndex <= 0
  const isLastCell = currentIndex === -1 || currentIndex === cells.length - 1

  const onSelectMoveCell = (direction: 'up' | 'down') => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    snap.moveCell({ id: notebookId, cellId, direction })
  }

  const onSelectRemoveCell = () => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return
    snap.removeCell({ id: notebookId, cellId })
  }

  return (
    <DropdownMenuContent align="start" className="w-40">
      <DropdownMenuItem
        className="gap-x-2"
        disabled={isFirstCell}
        onClick={() => onSelectMoveCell('up')}
      >
        <ArrowUp size={14} />
        <p>Move up</p>
      </DropdownMenuItem>
      <DropdownMenuItem
        className="gap-x-2"
        disabled={isLastCell}
        onClick={() => onSelectMoveCell('down')}
      >
        <ArrowDown size={14} />
        <p>Move down</p>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="gap-x-2" onClick={() => onSelectRemoveCell()}>
        <Trash size={14} />
        <p>Remove cell</p>
      </DropdownMenuItem>
    </DropdownMenuContent>
  )
}
