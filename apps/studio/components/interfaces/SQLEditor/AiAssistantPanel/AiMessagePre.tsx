import { InsertCode, ReplaceCode } from 'icons'
import { Check, Copy } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from 'sql-formatter'
import {
  Button,
  CodeBlock,
  TooltipContent_Shadcn_,
  TooltipTrigger_Shadcn_,
  Tooltip_Shadcn_,
  cn,
} from 'ui'

import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { DiffType } from '../SQLEditor.types'

interface AiMessagePreProps {
  onDiff: (type: DiffType, s: string) => void
  children: string[]
  className?: string
}

export const AiMessagePre = ({ onDiff, children, className }: AiMessagePreProps) => {
  const [copied, setCopied] = useState(false)

  const { mutate: sendEvent } = useSendEventMutation()

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  let formatted = (children || [''])[0]
  try {
    formatted = format(formatted, { language: 'postgresql', keywordCase: 'upper' })
  } catch {}

  if (formatted.length === 0) {
    return null
  }

  function handleCopy(formatted: string) {
    navigator.clipboard.writeText(formatted).then()
    setCopied(true)
  }

  return (
    <pre className={cn('rounded-md relative group', className)}>
      <CodeBlock
        value={formatted}
        language="sql"
        className={cn(
          '!bg-transparent !py-3 !px-3.5 prose dark:prose-dark',
          // change the look of the code block. The flex hack is so that the code is wrapping since
          // every word is a separate span
          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap [&>code]:block'
        )}
        hideCopy
        hideLineNumbers
      />
      <div className="absolute top-2 right-2 bg-surface-100 border-muted border rounded-lg h-[28px] hidden group-hover:block">
        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="text"
              size="tiny"
              onClick={() => {
                onDiff(DiffType.Addition, formatted)
                sendEvent({
                  category: 'sql_editor_ai_assistant',
                  action: 'ai_suggestion_inserted',
                  label: 'sql-editor-ai-assistant',
                })
              }}
            >
              <InsertCode className="h-4 w-4 text-foreground-light" strokeWidth={1.5} />
            </Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom" className="font-sans">
            Insert code
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>

        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="text"
              size="tiny"
              onClick={() => {
                onDiff(DiffType.Modification, formatted)
                sendEvent({
                  category: 'sql_editor_ai_assistant',
                  action: 'ai_suggestion_replaced',
                  label: 'sql-editor-ai-assistant',
                })
              }}
            >
              <ReplaceCode className="h-4 w-4 text-foreground-light" strokeWidth={1.5} />
            </Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom" className="font-sans">
            Replace code
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>

        <Tooltip_Shadcn_>
          <TooltipTrigger_Shadcn_ asChild>
            <Button
              type="text"
              size="tiny"
              onClick={() => {
                handleCopy(formatted)
                sendEvent({
                  category: 'sql_editor_ai_assistant',
                  action: 'ai_suggestion_copied',
                  label: 'sql-editor-ai-assistant',
                })
              }}
            >
              {copied ? (
                <Check size={16} className="text-brand-600" />
              ) : (
                <Copy size={16} className="text-foreground-light" strokeWidth={1.5} />
              )}
            </Button>
          </TooltipTrigger_Shadcn_>
          <TooltipContent_Shadcn_ side="bottom" className="font-sans">
            Copy code
          </TooltipContent_Shadcn_>
        </Tooltip_Shadcn_>
      </div>
    </pre>
  )
}
