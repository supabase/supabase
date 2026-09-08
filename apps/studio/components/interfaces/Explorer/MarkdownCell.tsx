import { Edit } from 'lucide-react'
import { useState } from 'react'
import { Button, cn } from 'ui'

import { Markdown } from '../Markdown'
import { AddCellDropdown } from './AddCellDropdown'
import { MoveCellDropdownContent } from './MoveCellDropdownContent'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type MarkdownCell as MarkdownCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useLatest } from '@/hooks/misc/useLatest'
import { useCurrentNotebook, useNotebooksStateSnapshot } from '@/state/notebooks/notebooks-state'

interface MarkdownCellProps {
  cell: MarkdownCellSchema
  onEdit?: () => void
}

// [Joshen] handleUpdateMarkdown could be shifted into notebook-state as a updateCell action

export const MarkdownCell = ({ cell, onEdit }: MarkdownCellProps) => {
  const snap = useNotebooksStateSnapshot()
  const currentNotebook = useCurrentNotebook()
  const cells = currentNotebook?.notebook.content?.cells ?? []

  const [value, setValue] = useState(cell.text)
  const [isEditing, setIsEditing] = useState(false)

  const valueRef = useLatest(value)

  const handleStartEditing = () => {
    setValue(cell.text)
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  const handleUpdateMarkdown = (cellId: string, text: string) => {
    const notebookId = currentNotebook?.notebook.id
    if (!notebookId) return

    onEdit?.()
    const nextCells = cells.map((c) => (c._id === cellId ? { ...c, text } : c))
    snap.updateCells({ id: notebookId, cells: nextCells })
    setIsEditing(false)
  }

  const handleUpdateMarkdownRef = useLatest(handleUpdateMarkdown)

  return (
    <SortableSection
      id={cell._id}
      actions={<AddCellDropdown cellId={cell._id} />}
      gripDropdownContent={<MoveCellDropdownContent cellId={cell._id} />}
      gripClassName="mt-1.5 opacity-0 group-hover:opacity-100 has-[[data-state=open]]:opacity-100 transition"
    >
      {isEditing ? (
        <div
          className={cn('w-full max-w-3xl mx-auto transition', 'overflow-hidden border rounded-md')}
        >
          <CodeEditor
            hideLineNumbers
            language="markdown"
            value={value}
            onInputChange={(e) => setValue(e ?? '')}
            className="h-[150px]"
            options={{ quickSuggestions: false, wordBasedSuggestions: 'off' }}
            onMount={(editor, monaco) => {
              editor.addCommand(
                monaco.KeyCode.Escape,
                handleCancel,
                [
                  'editorTextFocus',
                  '!editorHasSelection',
                  '!editorHasMultipleSelections',
                  '!suggestWidgetVisible',
                  '!findWidgetVisible',
                  '!parameterHintsVisible',
                  '!renameInputVisible',
                  '!inSnippetMode',
                  '!accessibilityHelpWidgetVisible',
                  '!inlineSuggestionVisible',
                ].join(' && ')
              )
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () =>
                handleUpdateMarkdownRef.current(cell._id, valueRef.current)
              )
              editor.onDidBlurEditorWidget(() =>
                handleUpdateMarkdownRef.current(cell._id, valueRef.current)
              )
            }}
          />
          <div className="border-t flex items-center justify-between pl-3 pr-1 py-1">
            <p className="text-xs text-foreground-lighter">Markdown</p>
            <div className="flex items-center gap-x-1">
              <Button variant="text" onMouseDown={(e) => e.preventDefault()} onClick={handleCancel}>
                Cancel
              </Button>
              <Button
                variant="text"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleUpdateMarkdown(cell._id, value)}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDoubleClick={handleStartEditing}
          className={cn(
            'group/mdcell relative w-full max-w-3xl mx-auto px-3 py-2 transition',
            'hover:bg-alternative/50',
            'border border-transparent rounded-md hover:border-default'
          )}
        >
          <ButtonTooltip
            variant="text"
            className={cn(
              'absolute right-1 top-1 px-1',
              'opacity-0 group-hover/mdcell:opacity-100 focus-visible:opacity-100'
            )}
            icon={<Edit size={14} />}
            onClick={handleStartEditing}
            tooltip={{ content: { side: 'bottom', text: 'Edit' } }}
          />
          {cell.text ? (
            <Markdown
              className={cn(
                'prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground',
                '[&>h1]:mb-2 [&>h2]:mb-2',
                '[&_ol>li]:pl-3',
                '[--tw-prose-body:var(--foreground-muted)]',
                '[--tw-prose-headings:var(--foreground-default)]',
                '[--tw-prose-links:var(--foreground-muted)]',
                '[--tw-prose-bold:var(--foreground-muted)]',
                '[--tw-prose-quotes:var(--foreground-muted)]'
              )}
            >
              {cell.text}
            </Markdown>
          ) : (
            <p className="text-foreground-lighter text-sm italic">This cell has no content</p>
          )}
        </div>
      )}
    </SortableSection>
  )
}
