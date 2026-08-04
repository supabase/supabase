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
}

export const MarkdownCellView = ({ cell, onChange }: MarkdownCellViewProps) => {
  const [isEditing, setIsEditing] = useState(false)

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
          {cell.markdown.trim().length > 0 ? (
            <Markdown content={cell.markdown} className="max-w-none" />
          ) : (
            <span className="text-xs text-foreground-lighter">
              Empty markdown cell — click to edit
            </span>
          )}
        </button>
      )}
    </div>
  )
}
