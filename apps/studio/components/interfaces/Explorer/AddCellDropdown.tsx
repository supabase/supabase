import { FileText, Plus, SquareCode } from 'lucide-react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { createMarkdownCellSkeleton, createQueryCellSkeleton } from './utils'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface AddCellDropdownProps {
  cellId: string
}

export const AddCellDropdown = ({ cellId }: AddCellDropdownProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()

  const onSelectAddCell = (type: 'markdown' | 'query') => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    const cell = type === 'markdown' ? createMarkdownCellSkeleton() : createQueryCellSkeleton()

    snap.insertCellAfter({ id: notebookId, cellId, cell })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <ButtonTooltip
          variant="text"
          className="w-7"
          icon={<Plus />}
          tooltip={{ content: { side: 'bottom', text: 'Add cell' } }}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-40">
        <DropdownMenuItem className="gap-x-2" onClick={() => onSelectAddCell('query')}>
          <SquareCode size={14} />
          <span>Add query cell</span>
        </DropdownMenuItem>
        <DropdownMenuItem className="gap-x-2" onClick={() => onSelectAddCell('markdown')}>
          <FileText size={14} />
          <span>Add markdown cell</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
