import * as Tooltip from '@radix-ui/react-tooltip'
import { Check, Copy, FileDiff } from 'lucide-react'
import { useEffect, useState } from 'react'
import { format } from 'sql-formatter'
import { Button, CodeBlock, cn } from 'ui'
import Telemetry from 'lib/telemetry'
import { useTelemetryProps } from 'common'
import { useRouter } from 'next/router'

interface AAIPolicyPreProps {
  onDiff: (s: string) => void
  children: string[]
  className?: string
}

export const AIPolicyPre = ({ onDiff, children, className }: AAIPolicyPreProps) => {
  const [copied, setCopied] = useState(false)
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

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
          '[&>code]:m-0 [&>code>span]:flex [&>code>span]:flex-wrap'
        )}
        hideCopy
        hideLineNumbers
      />
      <div className="absolute top-3 right-3 bg-surface-100 border-muted border rounded-lg h-[28px] hidden group-hover:block">
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              type="text"
              size="tiny"
              onClick={() => {
                onDiff(formatted)
                Telemetry.sendEvent(
                  {
                    category: 'rls_editor',
                    action: 'ai_suggestion_diffed',
                    label: 'rls-ai-assistant',
                  },
                  telemetryProps,
                  router
                )
              }}
            >
              <FileDiff className="h-4 w-4" />
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">Apply changes</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
        <Tooltip.Root delayDuration={0}>
          <Tooltip.Trigger asChild>
            <Button
              type="text"
              size="tiny"
              onClick={() => {
                handleCopy(formatted)
                Telemetry.sendEvent(
                  {
                    category: 'rls_editor',
                    action: 'ai_suggestion_copied',
                    label: 'rls-ai-assistant',
                  },
                  telemetryProps,
                  router
                )
              }}
            >
              {copied ? <Check size={16} className="text-brand-600" /> : <Copy size={16} />}
            </Button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content side="bottom">
              <Tooltip.Arrow className="radix-tooltip-arrow" />
              <div
                className={[
                  'rounded bg-alternative py-1 px-2 leading-none shadow',
                  'border border-background',
                ].join(' ')}
              >
                <span className="text-xs text-foreground">Copy code</span>
              </div>
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </div>
    </pre>
  )
}
