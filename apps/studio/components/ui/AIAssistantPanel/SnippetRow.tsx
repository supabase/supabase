import React from 'react'
import { Button, CodeBlock } from 'ui'
import { HoverCard_Shadcn_, HoverCardTrigger_Shadcn_, HoverCardContent_Shadcn_ } from 'ui'
import { X } from 'lucide-react'
import { type SqlSnippet } from './AIAssistant.types'

export const getSnippetLabel = (snippet: SqlSnippet, index: number): string => {
  if (typeof snippet === 'string') {
    return `Snippet ${index + 1}`
  }
  return snippet.label
}

export const getSnippetContent = (snippet: SqlSnippet): string => {
  if (typeof snippet === 'string') {
    return snippet
  }
  return snippet.content
}

interface SnippetRowProps {
  snippets: SqlSnippet[]
  onRemoveSnippet?: (index: number) => void
  className?: string
}

export const SnippetRow: React.FC<SnippetRowProps> = ({
  snippets,
  onRemoveSnippet,
  className = '',
}) => {
  if (!snippets || snippets.length === 0) return null

  return (
    <div className={`w-full overflow-x-auto flex ${className}`}>
      {snippets.map((snippet, idx) => (
        <HoverCard_Shadcn_ key={idx}>
          <HoverCardTrigger_Shadcn_ asChild>
            <div
              tabIndex={0}
              className="border bg inline-flex gap-1 items-center shrink-0 py-1 pl-2 rounded-full pr-1 text-xs cursor-pointer"
            >
              {getSnippetLabel(snippet, idx)}
              {onRemoveSnippet && (
                <Button
                  size="tiny"
                  type="text"
                  className="!h-4 !w-4 rounded-full p-0"
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveSnippet(idx)
                  }}
                  aria-label={`Remove snippet ${idx + 1}`}
                  icon={<X strokeWidth={1.5} className="!h-3 !w-3" />}
                />
              )}
            </div>
          </HoverCardTrigger_Shadcn_>
          <HoverCardContent_Shadcn_ className="w-96 max-h-64 overflow-auto p-0">
            <CodeBlock
              hideLineNumbers
              className="text-xs font-mono whitespace-pre-wrap break-words p-2 border-0"
              language="sql"
            >
              {getSnippetContent(snippet)}
            </CodeBlock>
          </HoverCardContent_Shadcn_>
        </HoverCard_Shadcn_>
      ))}
    </div>
  )
}
