import type { MarkdownEditorHandle } from 'markdown-editor/types'
import { lazy, Suspense, type Ref } from 'react'
import { cn } from 'ui'

import { AddCellDropdown } from './AddCellDropdown'
import { MoveCellDropdownContent } from './MoveCellDropdownContent'
import { NotebookCodeBlockEditor } from './NotebookCodeBlockEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type MarkdownCell as MarkdownCellSchema } from '@/data/content/notebooks/notebook-schema'
import { notebooksState, useCurrentNotebook } from '@/state/notebooks/notebooks-state'

const MarkdownEditor = lazy(() =>
  import('markdown-editor').then((module) => ({ default: module.MarkdownEditor }))
)
const components = { CodeBlockEditor: NotebookCodeBlockEditor }

interface MarkdownCellProps {
  cell: MarkdownCellSchema
  onEdit?: () => void
  ref?: Ref<MarkdownEditorHandle>
}

export const MarkdownCell = ({ cell, onEdit, ref }: MarkdownCellProps) => {
  const currentNotebook = useCurrentNotebook()
  const notebookId = currentNotebook?.notebook.id

  const handleDirty = () => {
    if (!notebookId) return
    notebooksState.markEdited({ id: notebookId })
    onEdit?.()
  }

  const handleChange = (text: string) => {
    if (!notebookId) return
    notebooksState.updateCell({
      id: notebookId,
      cellId: cell._id,
      updater: (current) => (current._tag === 'markdown_cell' ? { ...current, text } : current),
    })
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
          'prose prose-sm max-w-none text-foreground-light prose-headings:text-foreground [&>div>p:first-child]:mt-0 [&>div>:last-child]:mb-0',
          'prose-ol:my-2 prose-ul:my-2 prose-li:my-0.5 prose-li:leading-6',
          '[&_li>p]:my-1 [&_li>p]:leading-6 [&_li>p:first-child]:mt-0 [&_li>p:last-child]:mb-0',
          '[&_ol]:pl-0 [&_ol>li]:pl-8 [&_ol>li]:before:left-0 [&_ol>li]:before:top-0.5 [&_ol>li]:before:h-5 [&_ol>li]:before:w-5 [&_ol>li]:before:content-[counter(item)]',
          '[&_textarea[data-markdown-block-input]]:w-full [&_textarea[data-markdown-block-input]]:resize-none [&_textarea[data-markdown-block-input]]:bg-transparent [&_textarea[data-markdown-block-input]]:font-mono [&_textarea[data-markdown-block-input]]:text-sm'
        )}
      >
        <Suspense
          fallback={
            <div aria-busy="true" className="px-3 py-2 whitespace-pre-wrap">
              {cell.text}
            </div>
          }
        >
          <MarkdownEditor
            ref={ref}
            markdown={cell.text}
            onChange={handleChange}
            onDirty={handleDirty}
            aria-label="Markdown cell"
            components={components}
            className="min-h-12 px-3 py-2 border border-transparent rounded-md transition-colors hover:bg-alternative/50 focus:border-default focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </Suspense>
      </div>
    </SortableSection>
  )
}
