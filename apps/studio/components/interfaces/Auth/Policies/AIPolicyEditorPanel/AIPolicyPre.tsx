import * as Tooltip from '@radix-ui/react-tooltip'
import { Copy, FileDiff } from 'lucide-react'
import { format } from 'sql-formatter'
import { Button, CodeBlock, cn } from 'ui'

interface AAIPolicyPreProps {
  onDiff: (s: string) => void
  children: string[]
  className?: string
}

export const AIPolicyPre = ({ onDiff, children, className }: AAIPolicyPreProps) => {
  let formatted = (children || [''])[0]
  try {
    formatted = format(formatted, { language: 'postgresql', keywordCase: 'upper' })
  } catch {}

  if (formatted.length === 0) {
    return null
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
            <Button type="text" size="tiny" onClick={() => onDiff(formatted)}>
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
              onClick={() => navigator.clipboard.writeText(formatted).then()}
            >
              <Copy className="h-4 w-4" />
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
