import { useState } from 'react'
import { Button, cn } from 'ui'

import { Markdown } from '../Markdown'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'
import { SortableSection } from '@/components/ui/SortableSection'
import { type MarkdownCell as MarkdownCellSchema } from '@/data/content/notebooks/notebook-schema'
import { useLatest } from '@/hooks/misc/useLatest'

interface MarkdownCellProps {
  cell: MarkdownCellSchema
  onCommitChanges: (text: string) => void
}

export const MarkdownCell = ({ cell, onCommitChanges }: MarkdownCellProps) => {
  const [value, setValue] = useState(cell.text)
  const [isEditing, setIsEditing] = useState(false)

  const valueRef = useLatest(value)
  const onCommitChangesRef = useLatest(onCommitChanges)

  const handleCommit = () => {
    onCommitChangesRef.current(valueRef.current)
    setIsEditing(false)
  }

  return (
    <SortableSection gripClassName="mt-2.5" id={cell.id}>
      {isEditing ? (
        <div
          className={cn('w-full max-w-2xl mx-auto transition', 'overflow-hidden border rounded-md')}
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
                () => setIsEditing(false),
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
              editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, handleCommit)
              editor.onDidBlurEditorWidget(handleCommit)
            }}
          />
          <div className="border-t flex items-center justify-between pl-3 pr-1 py-1">
            <p className="text-xs text-foreground-lighter">Markdown</p>
            <div className="flex items-center gap-x-1">
              <Button variant="text" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button variant="text" onClick={handleCommit}>
                Save
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div
          onDoubleClick={() => {
            setValue(cell.text)
            setIsEditing(true)
          }}
          className={cn(
            'w-full max-w-2xl mx-auto px-3 py-2 transition',
            'hover:bg-alternative/50',
            'border border-transparent rounded-md hover:border-default'
          )}
        >
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
        </div>
      )}
    </SortableSection>
  )
}
