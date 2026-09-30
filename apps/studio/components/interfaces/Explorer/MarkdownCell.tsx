import { cn } from 'ui'

import { AddCellDropdown } from './AddCellDropdown'
import { MoveCellDropdownContent } from './MoveCellDropdownContent'
import { MarkdownEditor } from '@/components/ui/MarkdownEditor/MarkdownEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type MarkdownCell as MarkdownCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface MarkdownCellProps {
  cell: MarkdownCellSchema
  onEdit?: () => void
}

export const MarkdownCell = ({ cell, onEdit }: MarkdownCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const cells = currentNotebook?.notebook.content?.cells ?? []

  const handleUpdateMarkdown = (text: string) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId || text === cell.text) return

    onEdit?.()
    const nextCells = cells.map((c) => (c._id === cell._id ? { ...c, text } : c))
    snap.updateCells({ id: notebookId, cells: nextCells })
  }

  return (
    <SortableSection
      id={cell._id}
      sectionWidth="48rem"
      actions={<AddCellDropdown cellId={cell._id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell._id} />}
      gripClassName="mt-1.5 sm:opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      <div
        className={cn(
          'w-full transition',
          'border border-transparent rounded-md',
          'hover:border-default focus-within:border-default'
        )}
      >
        <MarkdownEditor
          value={cell.text}
          onBlur={handleUpdateMarkdown}
          placeholder="This cell has no content"
        />
      </div>
    </SortableSection>
  )
}
