import type { MDXEditorMethods } from '@mdxeditor/editor'
import { useEffect, useRef } from 'react'
import { cn } from 'ui'
import type { Snapshot } from 'valtio'

import { AddCellDropdown } from './AddCellDropdown'
import { MarkdownEditor } from './MarkdownEditor'
import { MoveCellDropdownContent } from './MoveCellDropdownContent'
import { SortableSection } from '@/components/ui/SortableSection'
import { type MarkdownCell as MarkdownCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface MarkdownCellProps {
  cell: Snapshot<MarkdownCellSchema>
  onEdit?: () => void
}

export const MarkdownCell = ({ cell, onEdit }: MarkdownCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const editorRef = useRef<MDXEditorMethods>(null)
  const latestMarkdownRef = useRef(cell.text)

  useEffect(() => {
    if (cell.text === latestMarkdownRef.current) return

    latestMarkdownRef.current = cell.text
    editorRef.current?.setMarkdown(cell.text)
  }, [cell.text])

  const handleChange = (markdown: string, initialMarkdownNormalize: boolean) => {
    if (initialMarkdownNormalize || markdown === latestMarkdownRef.current) return

    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    latestMarkdownRef.current = markdown
    onEdit?.()
    snap.updateCell({
      id: notebookId,
      cellId: cell._id,
      updater: (candidate) =>
        candidate._tag === 'markdown_cell' ? { ...candidate, text: markdown } : candidate,
    })
  }

  return (
    <SortableSection
      id={cell._id}
      actions={<AddCellDropdown cellId={cell._id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell._id} />}
      gripClassName="mt-1.5 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      <div
        className={cn(
          'relative w-full max-w-3xl mx-auto transition',
          'hover:bg-alternative/50 focus-within:bg-alternative/50',
          'border border-transparent rounded-md hover:border-default focus-within:border-default'
        )}
      >
        <MarkdownEditor
          ref={editorRef}
          markdown={cell.text}
          onChange={handleChange}
          placeholder={<span className="text-foreground-lighter italic">Type markdown...</span>}
          className="bg-transparent text-muted-foreground"
          contentEditableClassName={cn(
            'prose prose-sm dark:prose-dark max-w-none min-h-10 px-3 py-2 text-muted-foreground focus:outline-none',
            'prose-headings:text-foreground [&>h1]:mb-2 [&>h2]:mb-2 [&_ol>li]:pl-3',
            '[--tw-prose-body:var(--foreground-muted)]',
            '[--tw-prose-headings:var(--foreground-default)]',
            '[--tw-prose-links:var(--foreground-muted)]',
            '[--tw-prose-bold:var(--foreground-muted)]',
            '[--tw-prose-quotes:var(--foreground-muted)]'
          )}
        />
      </div>
    </SortableSection>
  )
}
