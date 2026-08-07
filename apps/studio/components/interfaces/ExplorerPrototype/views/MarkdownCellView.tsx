/**
 * PROTOTYPE — markdown cell. Click to edit, blur to preview.
 * Uses the shared CodeEditor in markdown mode and Studio's Markdown renderer.
 *
 * Like `QueryCell`, this owns no notebook chrome: reorder, delete and insert
 * are rendered by `NotebookCellShell` in the gutter beside it.
 */

import { useState } from 'react'
import { cn } from 'ui'

import type { MarkdownCell } from '../ExplorerPrototype.types'
import { Markdown } from '@/components/interfaces/Markdown'
import { CodeEditor } from '@/components/ui/CodeEditor/CodeEditor'

interface MarkdownCellViewProps {
  cell: MarkdownCell
  onChange: (cell: MarkdownCell) => void
  readOnly?: boolean
}

export const MarkdownCellView = ({ cell, onChange, readOnly = false }: MarkdownCellViewProps) => {
  const [isEditing, setIsEditing] = useState(false)

  const preview =
    cell.markdown.trim().length > 0 ? (
      <Markdown
        content={cell.markdown}
        className={cn(
          'prose prose-sm max-w-none text-muted-foreground prose-headings:text-foreground',
          '[--tw-prose-body:var(--foreground-muted)]',
          '[--tw-prose-headings:var(--foreground-default)]',
          '[--tw-prose-links:var(--foreground-muted)]',
          '[--tw-prose-bold:var(--foreground-muted)]',
          '[--tw-prose-quotes:var(--foreground-muted)]'
        )}
      />
    ) : (
      <span className="text-xs text-foreground-lighter">Empty markdown cell</span>
    )

  if (readOnly) return <div className="rounded-md px-3 py-2">{preview}</div>

  return (
    <div className="rounded-md">
      {isEditing ? (
        <div className="overflow-hidden rounded-md border bg-surface-100">
          <div className="h-40">
            <CodeEditor
              id={cell.id}
              language="markdown"
              value={cell.markdown}
              hideLineNumbers
              onInputChange={(next) => onChange({ ...cell, markdown: next ?? '' })}
              options={{ scrollBeyondLastLine: false, padding: { top: 10, bottom: 10 } }}
            />
          </div>
          <div className="flex justify-end border-t px-2 py-1">
            <button
              type="button"
              tabIndex={0}
              className="text-xs text-foreground-light hover:text-foreground"
              onClick={() => setIsEditing(false)}
            >
              Done
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          tabIndex={0}
          onClick={() => setIsEditing(true)}
          className={cn(
            'w-full rounded-md border border-transparent px-3 py-2 text-left',
            'hover:border-default hover:bg-surface-100'
          )}
        >
          {cell.markdown.trim().length > 0 ? preview : 'Empty markdown cell — click to edit'}
        </button>
      )}
    </div>
  )
}
